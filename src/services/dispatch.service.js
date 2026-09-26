import path from 'fs';
import { getDayConfig, getCurrentDayConfig } from '../constants/deities.js';
import { generateDevotionalBlessing, getOrGenerateDeityImage } from './ai.service.js';
import { whatsAppService } from './whatsapp.service.js';
import { FacebookService } from './facebook.service.js';
import { GalleryService } from './gallery.service.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import pathModule from 'path';

// Circular log buffer for recent dispatches (observability)
const recentDispatches = [];
const MAX_LOG_HISTORY = 50;

export class DispatchService {
  /**
   * Executes a morning devotional blessing dispatch across enabled channels.
   *
   * @param {Object} options
   * @param {string} [options.day] - Day identifier (e.g. 'monday')
   * @param {string} [options.imageId] - Optional specific image ID or filename
   * @param {string} [options.customBlessing] - Optional manual override for blessing text
   * @param {Array<string>} [options.channels] - Channels to dispatch to ['whatsapp', 'facebook']
   * @param {Array<string>} [options.recipients] - Optional list of recipient phone numbers
   * @param {boolean} [options.dryRun] - Explicit dry run override
   * @param {string} [options.triggerSource] - 'scheduler' | 'on-demand-web' | 'cli'
   */
  static async executeDispatch({
    day,
    imageId,
    customBlessing,
    channels = ['whatsapp', 'facebook'],
    recipients,
    dryRun = false,
    triggerSource = 'on-demand-web'
  } = {}) {
    const isDry = dryRun || config.isDryRun;
    const dayConfig = day ? getDayConfig(day) : getCurrentDayConfig();
    const effectiveDay = dayConfig.id;

    logger.info(`Starting dispatch routine for [${dayConfig.name}] triggered via [${triggerSource}]. DryRun: ${isDry}`);

    // 1. Resolve Blessing Text
    let blessingText = customBlessing;
    if (!blessingText) {
      blessingText = await generateDevotionalBlessing(effectiveDay);
    }

    // 2. Resolve Deity Image
    let imageInfo = null;
    if (imageId) {
      const selected = GalleryService.getImageByIdOrFilename(imageId);
      if (selected) {
        imageInfo = {
          filename: selected.filename,
          filepath: pathModule.join(config.imagesDir, selected.filename),
          url: selected.url,
          isGenerated: false
        };
      }
    }

    if (!imageInfo) {
      imageInfo = await getOrGenerateDeityImage(effectiveDay);
    }

    const dispatchRecord = {
      id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      day: effectiveDay,
      dayName: dayConfig.name,
      deity: dayConfig.deity,
      greetingHindi: dayConfig.greetingHindi,
      greetingEnglish: dayConfig.greetingEnglish,
      blessingText,
      image: imageInfo,
      triggerSource,
      isDryRun: isDry,
      channels: {}
    };

    // 3. Dispatch to WhatsApp
    if (channels.includes('whatsapp')) {
      logger.info(`Initiating WhatsApp dispatch for ${effectiveDay}...`);
      const waResult = await whatsAppService.sendBlessing(
        recipients,
        imageInfo.filepath,
        blessingText,
        isDry
      );
      dispatchRecord.channels.whatsapp = waResult;
    }

    // 4. Dispatch to Facebook Page
    if (channels.includes('facebook')) {
      logger.info(`Initiating Facebook Page dispatch for ${effectiveDay}...`);
      const fbResult = await FacebookService.publishPhoto(
        imageInfo.filepath,
        `${blessingText}\n\n#SuPrabhaat #${dayConfig.greetingEnglish.replace(/\s+/g, '')} #${dayConfig.name}`,
        isDry
      );
      dispatchRecord.channels.facebook = fbResult;
    }

    // Record to history buffer
    recentDispatches.unshift(dispatchRecord);
    if (recentDispatches.length > MAX_LOG_HISTORY) {
      recentDispatches.pop();
    }

    logger.info(`Completed dispatch execution: ${dispatchRecord.id}`);
    return dispatchRecord;
  }

  /**
   * Retrieves history of recent dispatches.
   */
  static getHistory() {
    return recentDispatches;
  }
}
