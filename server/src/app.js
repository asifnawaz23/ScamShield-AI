import express from 'express';
import cors from 'cors';
import { analyzeRouter } from './routes/analyze.js';
import { metaRouter } from './routes/meta.js';
import { authRouter } from './routes/auth.js';
import { errorHandler } from './middleware/security.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    methods: ['GET', 'POST', 'DELETE'],
  }));

  app.use(express.json({ limit: '6mb' }));

  app.use('/api', analyzeRouter);
  app.use('/api', metaRouter);
  app.use('/api', authRouter);

  // 404
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Endpoint not found.' });
  });

  app.use(errorHandler);

  return app;
}