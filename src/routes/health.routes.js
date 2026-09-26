import express from 'express';
import { whatsAppService } from '../services/whatsapp.service.js';
import { schedulerService } from '../services/scheduler.service.js';

const router = express.Router();

router.get('/liveness', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'suprabhaat',
    timestamp: new Date().toISOString()
  });
});

router.get('/readiness', (req, res) => {
  const waStatus = whatsAppService.getStatus();
  const schedStatus = schedulerService.getStatus();

  res.status(200).json({
    status: 'ready',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    components: {
      whatsapp: waStatus.status,
      scheduler: schedStatus.active ? 'active' : 'idle'
    }
  });
});

export const healthRoutes = router;
