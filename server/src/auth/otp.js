import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';

const OTP_LENGTH = 6;
const KEYLEN = 64;

export const OTP_CONFIG = {
  expiryMinutes: Math.max(1, Number(process.env.OTP_EXPIRY_MINUTES) || 10),
  resendCooldownSeconds: Math.max(15, Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60),
  maxAttempts: Math.max(3, Number(process.env.OTP_MAX_ATTEMPTS) || 5),
};

function hashSeed(value) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(value), salt, KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

export function hashOtp(code) {
  return hashSeed(code);
}

export function verifyOtpCode(code, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const candidate = scryptSync(String(code), salt, KEYLEN);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function generateOtp() {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
}

export function isOtpFormat(code) {
  return typeof code === 'string' && /^\d{6}$/.test(code);
}

export function expiryIso(now = new Date()) {
  return new Date(now.getTime() + OTP_CONFIG.expiryMinutes * 60 * 1000).toISOString();
}

export function maskEmail(email) {
  const [local, domain] = String(email).split('@');
  if (!domain) return '•••@•••';
  const head = local.length <= 2 ? local[0] || '•' : local.slice(0, 2);
  return `${head}${'•'.repeat(Math.min(4, Math.max(1, local.length - 2)))}@${domain}`;
}