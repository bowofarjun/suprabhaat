import express from 'express';
import { DAY_DEITY_MAPPING, DAYS_ORDER, getDayConfig } from '../constants/deities.js';
import { GalleryService } from '../services/gallery.service.js';
import { whatsAppService } from '../services/whatsapp.service.js';
import { FacebookService } from '../services/facebook.service.js';
import { schedulerService } from '../services/scheduler.service.js';
import { DispatchService } from '../services/dispatch.service.js';
import { generateDevotionalBlessing } from '../services/ai.service.js';
import { config } from '../config/index.js';

const router = express.Router();

/**
 * GET /api/days
 * Returns all 7 days with cultural metadata, deity info, and Monday default indicator.
 */
router.get('/days', (req, res) => {
  const days = DAYS_ORDER.map((dayKey) => {
    const item = DAY_DEITY_MAPPING[dayKey];
    return {
      id: item.id,
      name: item.name,
      hindiDay: item.hindiDay,
      greetingHindi: item.greetingHindi,
      greetingEnglish: item.greetingEnglish,
      deity: item.deity,
      deityHindi: item.deityHindi,
      theme: item.theme,
      colors: item.colors,
      isDefault: item.id === 'monday'
    };
  });

  res.json({
    defaultDay: 'monday',
    days
  });
});

/**
 * GET /api/images
 * Query params: ?day=monday (default) | tuesday | ... | all
 */
router.get('/images', (req, res) => {
  const filterDay = req.query.day || 'monday';
  const images = GalleryService.listImages(filterDay);

  res.json({
    filterDay,
    count: images.length,
    images
  });
});

/**
 * GET /api/status
 * Overall system status: WhatsApp connection, QR data, Facebook status, Scheduler status.
 */
router.get('/status', (req, res) => {
  const wa = whatsAppService.getStatus();
  const fb = FacebookService.getStatus();
  const sched = schedulerService.getStatus();

  res.json({
    service: 'SuPrabhaat',
    dryRunMode: config.isDryRun,
    whatsapp: wa,
    facebook: fb,
    scheduler: sched,
    defaultDay: 'monday',
    currentTimeIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  });
});

/**
 * POST /api/blessing/preview
 * Generates an AI devotional blessing preview for a specific day.
 */
router.post('/blessing/preview', async (req, res) => {
  try {
    const { day = 'monday' } = req.body;
    const dayConfig = getDayConfig(day);
    const blessing = await generateDevotionalBlessing(day);

    res.json({
      success: true,
      day: dayConfig.id,
      dayName: dayConfig.name,
      deity: dayConfig.deity,
      greetingHindi: dayConfig.greetingHindi,
      blessing
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/dispatch/on-demand
 * Dispatches a morning devotional blessing on-demand.
 */
router.post('/dispatch/on-demand', async (req, res) => {
  try {
    const {
      day = 'monday',
      imageId,
      customBlessing,
      channels = ['whatsapp'],
      recipients,
      dryRun
    } = req.body;

    const result = await DispatchService.executeDispatch({
      day,
      imageId,
      customBlessing,
      channels,
      recipients,
      dryRun,
      triggerSource: 'on-demand-web'
    });

    res.json({
      success: true,
      message: 'Devotional dispatch processed successfully.',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/scheduler/trigger
 * Triggers the scheduled morning routine immediately.
 */
router.post('/scheduler/trigger', async (req, res) => {
  try {
    const result = await schedulerService.triggerNow();
    res.json({
      success: true,
      message: 'Scheduled routine triggered manually.',
      result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/history
 * Returns recent dispatches.
 */
router.get('/history', (req, res) => {
  res.json({
    count: DispatchService.getHistory().length,
    history: DispatchService.getHistory()
  });
});

export const apiRoutes = router;
