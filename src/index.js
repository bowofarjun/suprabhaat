import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { healthRoutes } from './routes/health.routes.js';
import { apiRoutes } from './routes/api.routes.js';
import { whatsAppService } from './services/whatsapp.service.js';
import { schedulerService } from './services/scheduler.service.js';
import { DispatchService } from './services/dispatch.service.js';
import { getCurrentDayConfig } from './constants/deities.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets and images
app.use(express.static(config.publicDir));

// Mount Health Check Routes
app.use('/health', healthRoutes);

// Mount Application API Routes
app.use('/api', apiRoutes);

// Fallback to index.html for SPA routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(config.publicDir, 'index.html'));
});

// One-shot CLI dry-run execution
async function runCliDryRun() {
  const today = getCurrentDayConfig();
  logger.info(`Running one-shot CLI dry-run for ${today.name} (${today.deity})...`);
  try {
    const result = await DispatchService.executeDispatch({
      day: today.id,
      channels: ['whatsapp', 'facebook'],
      dryRun: true,
      triggerSource: 'cli-dry-run'
    });
    logger.info('CLI dry-run completed successfully!');
    logger.info(`Blessing Preview:\n${result.blessingText}`);
    logger.info(`Image: ${result.image?.filename}`);
    process.exit(0);
  } catch (err) {
    logger.error(`CLI dry-run failed: ${err.message}`);
    process.exit(1);
  }
}

// Start Server and Background Services
async function bootstrap() {
  logger.info('==================================================');
  logger.info('  🌅 Starting SuPrabhaat (सुप्रभात) Morning Bot  ');
  logger.info('==================================================');
  logger.info(`Environment: ${config.env}`);
  logger.info(`Port: ${config.port}`);
  logger.info(`Dry Run Mode: ${config.isDryRun}`);
  logger.info(`Cron Schedule: ${config.cronSchedule} (${config.cronTimezone})`);

  // Check if one-shot CLI execution requested
  if (process.argv.includes('--cli-test')) {
    await runCliDryRun();
    return;
  }

  // Start HTTP Web Server
  const server = app.listen(config.port, config.host, () => {
    logger.info(`🚀 SuPrabhaat Web Portal & API running at http://${config.host}:${config.port}`);
    logger.info(`   - Health Liveness:  http://${config.host}:${config.port}/health/liveness`);
    logger.info(`   - Health Readiness: http://${config.host}:${config.port}/health/readiness`);
    logger.info(`   - Web Dashboard:    http://${config.host}:${config.port}`);
  });

  // Initialize WhatsApp Client (Asynchronous)
  whatsAppService.initialize().catch((err) => {
    logger.error(`WhatsApp service initialization failure: ${err.message}`);
  });

  // Start Cron Scheduler
  schedulerService.start();

  // Graceful Shutdown
  const shutdown = () => {
    logger.info('Shutting down SuPrabhaat gracefully...');
    schedulerService.stop();
    server.close(() => {
      logger.info('HTTP server closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  logger.error(`Bootstrap error: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
