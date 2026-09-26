import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class FacebookService {
  /**
   * Returns Facebook Page configuration status.
   */
  static getStatus() {
    return {
      configured: Boolean(config.fbPageId && config.fbPageAccessToken),
      pageId: config.fbPageId ? `${config.fbPageId.slice(0, 4)}***` : null,
      apiVersion: config.fbGraphApiVersion
    };
  }

  /**
   * Publishes a photo with a devotional caption to the configured Facebook Page.
   *
   * @param {string} imagePath - Absolute path to image
   * @param {string} captionText - Devotional blessing text
   * @param {boolean} dryRun - If true, simulate dispatch
   */
  static async publishPhoto(imagePath, captionText, dryRun = false) {
    const isDry = dryRun || config.isDryRun;

    if (isDry) {
      logger.info('[DRY-RUN] Simulating Facebook Page photo post.');
      logger.info(`[DRY-RUN] Image Path: ${imagePath}`);
      logger.info(`[DRY-RUN] Caption: ${captionText}`);
      return {
        success: true,
        dryRun: true,
        postId: `dry_run_fb_post_${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    }

    if (!config.fbPageId || !config.fbPageAccessToken) {
      const msg = 'Facebook Page ID or Access Token is missing. Dispatch skipped.';
      logger.warn(msg);
      return {
        success: false,
        skipped: true,
        error: msg
      };
    }

    if (!fs.existsSync(imagePath)) {
      return {
        success: false,
        error: `Image file does not exist: ${imagePath}`
      };
    }

    try {
      const url = `https://graph.facebook.com/${config.fbGraphApiVersion}/${config.fbPageId}/photos`;
      const form = new FormData();
      form.append('source', fs.createReadStream(imagePath));
      form.append('caption', captionText);
      form.append('access_token', config.fbPageAccessToken);

      logger.info(`Uploading photo to Facebook Page ID: ${config.fbPageId}...`);
      const response = await axios.post(url, form, {
        headers: {
          ...form.getHeaders()
        },
        timeout: 30000
      });

      logger.info(`Facebook photo published successfully! Post/Photo ID: ${response.data.id || response.data.post_id}`);
      return {
        success: true,
        photoId: response.data.id,
        postId: response.data.post_id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const errDetail = error.response?.data?.error?.message || error.message;
      logger.error(`Facebook Graph API Error: ${errDetail}`);
      return {
        success: false,
        error: errDetail
      };
    }
  }
}
