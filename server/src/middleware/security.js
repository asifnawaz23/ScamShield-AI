import { rateLimit } from 'express-rate-limit';

export function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  // Remove control characters, keep newlines/tabs, trim, cap length.
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, 8000);
}

export const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many analysis requests. Please slow down and try again shortly. (Rate limited)' },
});

export const imageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many image analyses. Please try again shortly. (Rate limited)' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait a few minutes and try again.' },
});

export const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification code requests for this device. Please wait a while and try again.' },
});

export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts. Please request a new code and try again later.' },
});

export function validateType(type) {
  const allowed = new Set(['text', 'url', 'image', 'demo']);
  return allowed.has(type) ? type : 'text';
}

export function isValidDataUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('data:image/')) return false;
  if (value.length > 5_500_000) return false;
  return true;
}

export function errorHandler(err, req, res, _next) {
  console.error('[scamshield] error:', err.message);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The uploaded content is too large. Please keep files under 5 MB.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body could not be parsed as JSON.' });
  }
  res.status(500).json({ error: 'Something went wrong on our side. Please try again in a moment.' });
}