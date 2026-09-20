/**
 * ScamShield AI — Netlify serverless API entry point.
 *
 * This is the ONE production entry point for the backend. It wraps the single
 * Express application built by createApp() with serverless-http so every
 * `/api/*` request (routed here by netlify.toml) is handled by the same app
 * used in local development (server/index.js).
 *
 * Do not add other Express entry points — a single createApp() instance keeps
 * middleware, CORS, and routing consistent across local and production.
 */
import serverless from 'serverless-http';
import { createApp } from '../../src/app.js';

export const handler = serverless(createApp());
