import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/index.js';
import { healthRoutes } from './routes/health.routes.js';
import { apiRoutes } from './routes/api.routes.js';

export const app = express();

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
