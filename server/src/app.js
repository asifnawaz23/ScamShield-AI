import express from 'express';
import cors from 'cors';
import { analyzeRouter } from './routes/analyze.js';
import { metaRouter, ensureScenariosSeeded } from './routes/meta.js';
import { authRouter } from './routes/auth.js';
import { errorHandler } from './middleware/security.js';
import { initDb } from './db/db.js';

/**
 * Build the CORS origin policy.
 *
 * SECURITY: production must NOT reflect all origins. Previously, when
 * CORS_ORIGIN was unset the config used `origin: true` (allow any origin) even
 * in production. Now:
 *   - production: only the explicit CORS_ORIGIN allow-list is accepted. If it
 *     is unset, no cross-origin browser access is granted (same-origin only),
 *     which is the safe default for the Netlify single-domain architecture
 *     where the SPA and the API function share one origin.
 *   - development/test: localhost dev origins are allowed for convenience.
 */
function corsOptions() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.NETLIFY) ||
    Boolean(process.env.VERCEL);

  const configured = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (isProduction) {
    // Same-origin requests carry no Origin header; cors() allows those through.
    // Only explicitly listed cross-origins are permitted.
    return { origin: configured.length ? configured : false, methods: ['GET', 'POST', 'DELETE'] };
  }

  const devDefaults = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const allowed = configured.length ? [...new Set([...configured, ...devDefaults])] : devDefaults;
  return { origin: allowed, methods: ['GET', 'POST', 'DELETE'] };
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(cors(corsOptions()));

  app.use(express.json({ limit: '6mb' }));

  // DB readiness gate: guarantees the schema exists before any route touches the
  // database. initDb() is guarded by a shared promise, so this is a no-op after
  // the first call — important for serverless cold starts where createApp() runs
  // fresh per instance. Scenario seeding is kicked off once behind the same gate.
  app.use('/api', async (_req, _res, next) => {
    try {
      await initDb();
      await ensureScenariosSeeded();
      next();
    } catch (err) {
      next(err);
    }
  });

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