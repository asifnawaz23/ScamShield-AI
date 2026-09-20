/**
 * ScamShield AI — Email verification token service.
 *
 * Clickable email verification (distinct from the OTP login codes):
 *   - token is cryptographically random (32 bytes, base64url)
 *   - only the SHA-256 HASH is stored; the raw token lives only in the email link
 *   - single-use (used_at is set on success; reuse is rejected)
 *   - time-limited (default 60 minutes)
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import {
  createEmailVerificationToken,
  findVerificationTokenByHash,
  markVerificationTokenUsed,
  cleanupExpiredVerificationTokens,
} from '../db/db.js';

export const VERIFICATION_CONFIG = {
  expiryMinutes: Math.max(5, Number(process.env.EMAIL_VERIFY_EXPIRY_MINUTES) || 60),
};

function hashToken(rawToken) {
  return createHash('sha256').update(String(rawToken)).digest('hex');
}

/**
 * Issue a fresh verification token for a user. Invalidates prior unused tokens
 * (handled in the DB layer). Returns the RAW token to embed in the email link.
 */
export async function issueVerificationToken(userId) {
  await cleanupExpiredVerificationTokens();
  const rawToken = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + VERIFICATION_CONFIG.expiryMinutes * 60 * 1000).toISOString();
  await createEmailVerificationToken({
    id: randomUUID(),
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });
  return rawToken;
}

/**
 * Validate a raw token. Returns { ok, reason, userId }.
 * reason ∈ 'invalid' | 'expired' | 'used'. On success the token is consumed.
 */
export async function consumeVerificationToken(rawToken) {
  if (typeof rawToken !== 'string' || rawToken.length < 20) {
    return { ok: false, reason: 'invalid' };
  }
  const record = await findVerificationTokenByHash(hashToken(rawToken));
  if (!record) return { ok: false, reason: 'invalid' };
  if (record.used_at) return { ok: false, reason: 'used' };
  if (new Date(record.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'expired' };
  }
  await markVerificationTokenUsed(record.id);
  return { ok: true, userId: record.user_id };
}

/**
 * Build the public verification URL the user clicks.
 */
export function buildVerifyUrl(rawToken) {
  const base =
    (process.env.APP_PUBLIC_URL && process.env.APP_PUBLIC_URL.replace(/\/+$/, '')) ||
    (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',')[0].trim() : '') ||
    'http://localhost:5173';
  return `${base}/verify-email?token=${encodeURIComponent(rawToken)}`;
}
