import cron from 'node-cron';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { getCurrentDayConfig } from '../constants/deities.js';
import { DispatchService } from './dispatch.service.js';

class SchedulerService {
  constructor() {
    this.cronTask = null;
    this.isActive = false;
    this.lastRunTimestamp = null;
    this.lastRunResult = null;
  }

  /**
   * Initializes the daily morning cron job.
   */
  start() {
    if (this.cronTask) {
      logger.warn('Scheduler is already running.');
      return;
    }

    const schedule = config.cronSchedule;
    const timezone = config.cronTimezone;

    logger.info(`Starting morning blessings scheduler with cron [${schedule}] timezone [${timezone}]...`);

    if (!cron.validate(schedule)) {
      logger.error(`Invalid cron pattern: "${schedule}". Scheduler not started.`);
      return;
    }

    this.cronTask = cron.schedule(
      schedule,
      async () => {
        const today = getCurrentDayConfig();
        logger.info(`⏰ Daily morning cron triggered for ${today.name} (${today.deity})!`);
        this.lastRunTimestamp = new Date().toISOString();

        try {
          const result = await DispatchService.executeDispatch({
            day: today.id,
            channels: ['whatsapp', 'facebook'],
            triggerSource: 'scheduler',
            dryRun: config.isDryRun
          });
          this.lastRunResult = { success: true, id: result.id };
        } catch (err) {
          logger.error(`Cron execution error: ${err.message}`);
          this.lastRunResult = { success: false, error: err.message };
        }
      },
      {
        scheduled: true,
        timezone
      }
    );

    this.isActive = true;
    logger.info('Scheduler started successfully. Daily devotional dispatch configured.');
  }

  /**
   * Stops the cron scheduler.
   */
  stop() {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
      this.isActive = false;
      logger.info('Scheduler stopped.');
    }
  }

  /**
   * Returns current scheduler state.
   */
  getStatus() {
    return {
      active: this.isActive,
      cronSchedule: config.cronSchedule,
      timezone: config.cronTimezone,
      lastRunTimestamp: this.lastRunTimestamp,
      lastRunResult: this.lastRunResult
    };
  }

  /**
   * Manually triggers the current day's routine immediately.
   */
  async triggerNow() {
    const today = getCurrentDayConfig();
    logger.info(`Manual trigger invoked for ${today.name}`);
    return await DispatchService.executeDispatch({
      day: today.id,
      channels: ['whatsapp', 'facebook'],
      triggerSource: 'manual-trigger',
      dryRun: config.isDryRun
    });
  }
}

export const schedulerService = new SchedulerService();
