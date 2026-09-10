import { Router } from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import { db, createUser, getUserByEmail, getUserById, getUserByProvider, setUserEmailVerified, touchUser, createOtp, getLatestOtp, getLatestOtpAnyStatus, incrementOtpAttempts, markOtpVerified, deleteOtpsForEmail, cleanupExpiredOtps, savePendingSignup, getPendingSignup, deletePendingSignup, cleanupPendingSignups } from '../db/db.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { signToken } from '../auth/token.js';
import { generateOtp, hashOtp, verifyOtpCode, isOtpFormat, expiryIso, maskEmail, OTP_CONFIG } from '../auth/otp.js';
import { sendVerificationEmail } from '../auth/mailer.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter, otpSendLimiter, otpVerifyLimiter } from '../middleware/security.js';
import { isGoogleConfigured, buildGoogleAuthUrl, exchangeGoogleCode } from '../auth/google.js';

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]{1,254}@[^\s@]{1,254}\.[^\s@]{2,}$/;
const CLIENT_ORIGIN = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',')[0] : 'http://localhost:5173';

function toPublicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar,
    provider: u.provider,
    emailVerified: Boolean(u.email_verified),
    createdAt: u.created_at,
  };
}

function sanitizeName(name) {
  return String(name || '').trim().replace(/<[^>]*>/g, '').slice(0, 60);
}

function validEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return EMAIL_RE.test(email) && email.length <= 254 ? email : null;
}

function issueToken(user) {
  return signToken({ userId: user.id, email: user.email, name: user.name });
}

authRouter.post('/auth/signup', authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const name = sanitizeName(req.body?.name) || email.split('@')[0];
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    if (await getUserByEmail(email)) {
      return res.status(409).json({ error: 'An account with this email already exists. Try signing in instead.' });
    }
    const user = await createUser({ email, name, passwordHash: hashPassword(password), provider: 'email' });
    const token = issueToken(user);
    res.status(201).json({ ok: true, token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/auth/login', authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!EMAIL_RE.test(email) || !password) {
      return res.status(400).json({ error: 'Please enter your email and password.' });
    }
    const user = await getUserByEmail(email);
    if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    const token = issueToken(user);
    res.json({ ok: true, token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/auth/logout', (_req, res) => {
  // Stateless bearer-token sessions: the client discards the token. This
  // endpoint exists so the UI can make the sign-out explicit.
  res.json({ ok: true, message: 'Signed out.' });
});

authRouter.get('/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) return res.status(401).json({ error: 'This account no longer exists.' });
    res.json({ ok: true, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/auth/google/config', (_req, res) => {
  res.json({ ok: true, enabled: isGoogleConfigured() });
});

authRouter.get('/auth/google/url', (req, res) => {
  if (!isGoogleConfigured()) {
    return res.status(400).json({ error: 'Google sign-in is not configured on the server yet.' });
  }
  const state = randomBytes(16).toString('hex');
  res.json({ ok: true, url: buildGoogleAuthUrl(state) });
});

authRouter.post('/auth/google/demo', async (req, res, next) => {
  try {
    let user = await getUserByProvider('google-demo', 'demo');
    if (!user) {
      user = await createUser({
        email: 'demo.google@scamshield.local',
        name: 'Demo Google User',
        provider: 'google-demo',
        providerId: 'demo',
        avatar: null,
        emailVerified: true,
      });
    }
    const token = issueToken(user);
    res.json({ ok: true, demo: true, token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/auth/google/callback', async (req, res, next) => {
  try {
    const code = String(req.query.code || '');
    if (!code) throw new Error('Missing authorization code.');
    const profile = await exchangeGoogleCode(code);
    let user = await getUserByProvider('google', profile.googleId);
    if (!user && profile.email) user = await getUserByEmail(profile.email);
    if (!user) {
      user = await createUser({
        email: profile.email || `${profile.googleId}@google.scamshield.local`,
        name: profile.name || 'Google User',
        provider: 'google',
        providerId: profile.googleId,
        avatar: profile.avatar,
        emailVerified: true,
      });
    } else {
      // Link the verified Google identity to an existing account (no duplicates).
      setUserEmailVerified(user.email);
      if (!user.provider_id && user.provider === 'email') {
        db.prepare(`UPDATE users SET provider = 'google', provider_id = ? WHERE id = ?`).run(profile.googleId, user.id);
        user = await getUserById(user.id);
      }
    }
    const token = issueToken(user);
    const query = new URLSearchParams({ token, user: JSON.stringify(toPublicUser(user)) });
    res.redirect(`${CLIENT_ORIGIN}/auth/callback?${query.toString()}`);
  } catch (err) {
    res.redirect(`${CLIENT_ORIGIN}/auth/callback?error=google_signin_failed`);
  }
});

// --- Email OTP --------------------------------------------------------------

async function issueOtpForEmail(email) {
  cleanupExpiredOtps();

  const latest = getLatestOtpAnyStatus(email);
  if (latest) {
    const created = new Date(latest.created_at).getTime();
    const wait = OTP_CONFIG.resendCooldownSeconds - Math.floor((Date.now() - created) / 1000);
    if (wait > 0) {
      return { status: 429, body: { error: `Please wait ${wait} seconds before requesting another code.`, retryAfter: wait } };
    }
  }

  const code = generateOtp();
  const expiresAt = expiryIso();
  deleteOtpsForEmail(email);
  createOtp({ id: randomUUID(), email, codeHash: hashOtp(code), expiresAt });

  let send;
  try {
    send = await sendVerificationEmail({ to: email, code, expiresMinutes: OTP_CONFIG.expiryMinutes });
  } catch (err) {
    deleteOtpsForEmail(email);
    console.error('[auth] email delivery failed:', err.message);
    return { status: 502, body: { error: 'We could not send the verification code right now. Please try again shortly.' } };
  }

  return { send };
}

function otpResponse(res, result) {
  if (result.status) return res.status(result.status).json(result.body);
  return null;
}

authRouter.post('/auth/send-otp', authLimiter, otpSendLimiter, async (req, res, next) => {
  try {
    const email = validEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const result = await issueOtpForEmail(email);
    const blocked = otpResponse(res, result);
    if (blocked) return null;

    res.json({
      ok: true,
      message: 'Verification code sent to your email.',
      email: maskEmail(email),
      delivered: result.send.delivered,
      channel: result.send.channel,
      resendAfter: OTP_CONFIG.resendCooldownSeconds,
      expiresInMinutes: OTP_CONFIG.expiryMinutes,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/auth/signup-send-otp', authLimiter, otpSendLimiter, async (req, res, next) => {
  try {
    const email = validEmail(req.body?.email);
    const name = sanitizeName(req.body?.name);
    const password = String(req.body?.password || '');
    if (!email) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Please enter your name.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    if (await getUserByEmail(email)) {
      return res.status(409).json({ error: 'An account with this email already exists. Try signing in instead.' });
    }

    const result = await issueOtpForEmail(email);
    const blocked = otpResponse(res, result);
    if (blocked) return null;

    savePendingSignup({ email, name, passwordHash: hashPassword(password) });

    res.json({
      ok: true,
      message: 'Verification code sent to your email.',
      email: maskEmail(email),
      delivered: result.send.delivered,
      channel: result.send.channel,
      resendAfter: OTP_CONFIG.resendCooldownSeconds,
      expiresInMinutes: OTP_CONFIG.expiryMinutes,
    });
  } catch (err) {
    next(err);
  }
});

function cleanupPendingSignupsGuard() {
  try {
    cleanupPendingSignups();
  } catch {
    // never block auth on housekeeping
  }
}

authRouter.post('/auth/verify-otp', authLimiter, otpVerifyLimiter, async (req, res, next) => {
  try {
    cleanupPendingSignupsGuard();
    const email = validEmail(req.body?.email);
    const code = String(req.body?.code || '').trim();
    if (!email) {
      return res.status(400).json({ error: 'The email address is missing or invalid.' });
    }
    if (!isOtpFormat(code)) {
      return res.status(400).json({ error: 'That code is incorrect. Please check your email and try again.' });
    }

    const otp = getLatestOtp(email);
    if (!otp || otp.verified) {
      return res.status(400).json({ error: 'Verification code not found. Please request a new one.' });
    }
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      markOtpVerified(otp.id);
      return res.status(400).json({ error: 'This code has expired. Please request a new one.' });
    }
    if (otp.attempts >= OTP_CONFIG.maxAttempts) {
      markOtpVerified(otp.id);
      return res.status(429).json({ error: 'Too many attempts. Please wait and request a new code.' });
    }

    if (!verifyOtpCode(code, otp.code_hash)) {
      incrementOtpAttempts(otp.id);
      const remaining = OTP_CONFIG.maxAttempts - (otp.attempts + 1);
      const msg =
        remaining <= 0
          ? 'Too many attempts. Please wait and request a new code.'
          : `That code is incorrect. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`;
      return res.status(400).json({ error: msg });
    }

    markOtpVerified(otp.id);
    deleteOtpsForEmail(email);
    setUserEmailVerified(email);

    const pending = getPendingSignup(email);
    let user = await getUserByEmail(email);
    const isNew = !user;
    if (!user) {
      if (pending) {
        // Verified signup: create the account with the name and salted password
        // the person entered when signing up — and only after proving email ownership.
        user = await createUser({
          email,
          name: pending.name,
          passwordHash: pending.password_hash,
          provider: 'email',
          emailVerified: true,
        });
        deletePendingSignup(email);
      } else {
        // Passwordless login auto-signup (existing behavior).
        const local = email.split('@')[0].replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() || 'User';
        user = await createUser({
          email,
          name: local.charAt(0).toUpperCase() + local.slice(1),
          provider: 'email',
          emailVerified: true,
        });
      }
    } else {
      touchUser(user.id);
      deletePendingSignup(email);
    }

    const token = issueToken(user);
    res.json({ ok: true, token, user: toPublicUser(user), isNew });
  } catch (err) {
    next(err);
  }
});