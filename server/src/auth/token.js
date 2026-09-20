import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Resolve the JWT signing secret with a hard production guard.
 *
 * SECURITY: previously this fell back to a hardcoded string
 * ('scamshield-dev-secret-change-me') whenever JWT_SECRET was unset — which
 * meant anyone who read the public source could forge tokens on a misconfigured
 * production deploy. Now:
 *   - production (NODE_ENV=production OR NETLIFY/VERCEL serverless):
 *       a real JWT_SECRET is REQUIRED. Missing, too short, or the known
 *       placeholder → throw at startup so the deploy fails loudly instead of
 *       silently running insecure.
 *   - development/test: a local dev secret is allowed for convenience, but a
 *     warning is logged so it is never mistaken for production-grade.
 */
const PLACEHOLDER_SECRETS = new Set([
  'change-me-to-a-long-random-string',
  'scamshield-dev-secret-change-me',
  '',
]);

function resolveSecret() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.NETLIFY) ||
    Boolean(process.env.VERCEL);
  const configured = process.env.JWT_SECRET || '';

  if (isProduction) {
    if (PLACEHOLDER_SECRETS.has(configured) || configured.length < 32) {
      throw new Error(
        '[scamshield] JWT_SECRET is missing, too short, or a placeholder in production. ' +
          'Set a strong random JWT_SECRET (>= 32 chars). ' +
          'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
      );
    }
    return configured;
  }

  // Development / test only.
  if (PLACEHOLDER_SECRETS.has(configured) || configured.length < 32) {
    console.warn(
      '[scamshield] Using an insecure development JWT secret. ' +
        'This is only allowed outside production. Set JWT_SECRET for real deployments.',
    );
    return 'scamshield-dev-only-secret-not-for-production';
  }
  return configured;
}

const SECRET = resolveSecret();

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

export function signToken(payload, expiresInSec = 7 * 24 * 3600) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec }));
  const sig = createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token) {
  if (typeof token !== 'string' || token.split('.').length !== 3) return null;
  const [header, body, sig] = token.split('.');
  const expected = createHmac('sha256', SECRET).update(`${header}.${body}`).digest();
  const provided = Buffer.from(sig, 'base64url');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}