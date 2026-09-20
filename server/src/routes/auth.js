import { Router } from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import { createUser, getUserByEmail, getUserById, getUserByProvider, setUserEmailVerified, touchUser, linkGoogleIdentity, createOtp, getLatestOtp, getLatestOtpAnyStatus, incrementOtpAttempts, markOtpVerified, deleteOtpsForEmail, cleanupExpiredOtps, savePendingSignup, getPendingSignup, deletePendingSignup, cleanupPendingSignups, saveOauthState, consumeOauthState, cleanupExpiredOauthStates } from '../db/db.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { signToken } from '../auth/token.js';
import { generateOtp, hashOtp, verifyOtpCode, isOtpFormat, expiryIso, maskEmail, OTP_CONFIG } from '../auth/otp.js';
import { sendVerificationEmail, sendEmailVerificationLink } from '../auth/mailer.js';
import { issueVerificationToken, consumeVerificationToken, buildVerifyUrl, VERIFICATION_CONFIG } from '../auth/verification.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter, otpSendLimiter, otpVerifyLimiter, verifyResendLimiter } from '../middleware/security.js';
import { isGoogleConfigured, buildGoogleAuthUrl, exchangeGoogleCode } from '../auth/google.js';

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]{1,254}@[^\s@]{1,254}\.[^\s@]{2,}$/;
const CLIENT_ORIGIN = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',')[0] : 'http://localhost:5173';
const IS_PRODUCTION =
  process.env.NODE_ENV === 'production' || Boolean(process.env.NETLIFY) || Boolean(process.env.VERCEL);

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

/**
 * Issue a verification token for a user and email them the clickable link.
 * Returns the delivery result; throws only on a genuine send failure so the
 * caller can respond appropriately (never marking the email verified).
 */
async function sendVerifyLinkFor(user) {
  const rawToken = await issueVerificationToken(user.id);
  const verifyUrl = buildVerifyUrl(rawToken);
  return sendEmailVerificationLink({
    to: user.email,
    verifyUrl,
    expiresMinutes: VERIFICATION_CONFIG.expiryMinutes,
  });
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
    // Create the account UNVERIFIED. No auto-login token is issued — the user
    // must verify their email first.
    const user = await createUser({ email, name, passwordHash: hashPassword(password), provider: 'email', emailVerified: false });

    let delivered = false;
    try {
      const result = await sendVerifyLinkFor(user);
      delivered = result.delivered;
    } catch (err) {
      // Don't fail the whole signup on a transient email error — the account
      // exists and the user can request a resend. Never claim it was sent.
      console.error('[auth] verification email failed:', err.message);
    }

    res.status(201).json({
      ok: true,
      requiresVerification: true,
      delivered,
      email: maskEmail(email),
      user: toPublicUser(user),
      message: 'Account created. Please check your email to verify your address before signing in.',
    });
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
    // Block unverified email/password accounts with a clear, actionable message.
    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Please verify your email before signing in. Check your inbox for the verification link.',
        requiresVerification: true,
        email: maskEmail(user.email),
      });
    }
    const token = issueToken(user);
    res.json({ ok: true, token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

/**
 * Verify an email via the clickable link token.
 * Single-use, time-limited. On success the account is marked verified and a
 * session token is issued so the user is signed in immediately.
 */
authRouter.post('/auth/verify-email', authLimiter, async (req, res, next) => {
  try {
    const token = String(req.body?.token || '');
    const result = await consumeVerificationToken(token);
    if (!result.ok) {
      const messages = {
        invalid: 'This verification link is invalid.',
        expired: 'This verification link has expired. Please request a new one.',
        used: 'This verification link has already been used. Try signing in.',
      };
      return res.status(400).json({ error: messages[result.reason] || messages.invalid, reason: result.reason });
    }
    const user = await getUserById(result.userId);
    if (!user) return res.status(400).json({ error: 'This account no longer exists.' });
    await setUserEmailVerified(user.email);
    const fresh = await getUserById(user.id);
    const sessionToken = issueToken(fresh);
    res.json({ ok: true, token: sessionToken, user: toPublicUser(fresh) });
  } catch (err) {
    next(err);
  }
});

/**
 * Resend the verification email. Rate-limited. To avoid account enumeration we
 * always return a generic success response, regardless of whether the email
 * belongs to an account or is already verified.
 */
authRouter.post('/auth/resend-verification', authLimiter, verifyResendLimiter, async (req, res, next) => {
  try {
    const email = validEmail(req.body?.email);
    const generic = {
      ok: true,
      message: 'If an unverified account exists for that email, a new verification link has been sent.',
    };
    if (!email) return res.json(generic);

    const user = await getUserByEmail(email);
    if (user && !user.email_verified && user.provider === 'email') {
      try {
        await sendVerifyLinkFor(user);
      } catch (err) {
        console.error('[auth] resend verification failed:', err.message);
      }
    }
    res.json(generic);
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

authRouter.get('/auth/google/url', async (req, res, next) => {
  try {
    if (!isGoogleConfigured()) {
      return res.status(400).json({ error: 'Google sign-in is not configured on the server yet.' });
    }
    // CSRF protection: generate a cryptographically random state, persist it
    // (short-lived), and require the exact value back on the callback.
    await cleanupExpiredOauthStates();
    const state = randomBytes(32).toString('hex');
    await saveOauthState(state);
    res.json({ ok: true, url: buildGoogleAuthUrl(state) });
  } catch (err) {
    next(err);
  }
});

/**
 * Demo Google sign-in — a fake account for local demos only. This is DISABLED
 * in production so real deployments never expose a passwordless backdoor.
 */
authRouter.post('/auth/google/demo', async (req, res, next) => {
  try {
    if (IS_PRODUCTION) {
      return res.status(403).json({ error: 'Demo Google sign-in is disabled in production. Use real Google sign-in.' });
    }
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
    const state = String(req.query.state || '');
    if (!code) throw new Error('Missing authorization code.');

    // CSRF: the state must match one we issued and not be expired. consume is
    // single-use. Reject before doing any token exchange.
    const stateOk = await consumeOauthState(state);
    if (!stateOk) {
      return res.redirect(`${CLIENT_ORIGIN}/auth/callback?error=google_state_invalid`);
    }

    const profile = await exchangeGoogleCode(code);
    // Google's userinfo only returns an email we treat as verified; guard it.
    const googleEmail = profile.email ? String(profile.email).toLowerCase() : '';

    let user = await getUserByProvider('google', profile.googleId);
    if (!user && googleEmail) {
      // Safe account linking: only link to an existing account when the email
      // matches. Google emails are verified by Google, so this does not enable
      // takeover of an unverified local account by an attacker.
      const existing = await getUserByEmail(googleEmail);
      if (existing) {
        await setUserEmailVerified(existing.email);
        // Link only if the existing account isn't already bound to a different
        // provider identity.
        user =
          !existing.provider_id || existing.provider === 'email'
            ? await linkGoogleIdentity(existing.id, profile.googleId)
            : existing;
      }
    }

    if (!user) {
      user = await createUser({
        email: googleEmail || `${profile.googleId}@google.scamshield.local`,
        name: profile.name || 'Google User',
        provider: 'google',
        providerId: profile.googleId,
        avatar: profile.avatar,
        emailVerified: true,
      });
    }

    const token = issueToken(user);
    const query = new URLSearchParams({ token, user: JSON.stringify(toPublicUser(user)) });
    res.redirect(`${CLIENT_ORIGIN}/auth/callback?${query.toString()}`);
  } catch (err) {
    console.error('[auth] google callback failed:', err.message);
    res.redirect(`${CLIENT_ORIGIN}/auth/callback?error=google_signin_failed`);
  }
});

// --- Email OTP --------------------------------------------------------------

async function issueOtpForEmail(email) {
  await cleanupExpiredOtps();

  const latest = await getLatestOtpAnyStatus(email);
  if (latest) {
    const created = new Date(latest.created_at).getTime();
    const wait = OTP_CONFIG.resendCooldownSeconds - Math.floor((Date.now() - created) / 1000);
    if (wait > 0) {
      return { status: 429, body: { error: `Please wait ${wait} seconds before requesting another code.`, retryAfter: wait } };
    }
  }

  const code = generateOtp();
  const expiresAt = expiryIso();
  await deleteOtpsForEmail(email);
  await createOtp({ id: randomUUID(), email, codeHash: hashOtp(code), expiresAt });

  let send;
  try {
    send = await sendVerificationEmail({ to: email, code, expiresMinutes: OTP_CONFIG.expiryMinutes });
  } catch (err) {
    await deleteOtpsForEmail(email);
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

    await savePendingSignup({ email, name, passwordHash: hashPassword(password) });

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

async function cleanupPendingSignupsGuard() {
  try {
    await cleanupPendingSignups();
  } catch {
    // never block auth on housekeeping
  }
}

authRouter.post('/auth/verify-otp', authLimiter, otpVerifyLimiter, async (req, res, next) => {
  try {
    await cleanupPendingSignupsGuard();
    const email = validEmail(req.body?.email);
    const code = String(req.body?.code || '').trim();
    if (!email) {
      return res.status(400).json({ error: 'The email address is missing or invalid.' });
    }
    if (!isOtpFormat(code)) {
      return res.status(400).json({ error: 'That code is incorrect. Please check your email and try again.' });
    }

    const otp = await getLatestOtp(email);
    if (!otp || otp.verified) {
      return res.status(400).json({ error: 'Verification code not found. Please request a new one.' });
    }
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      await markOtpVerified(otp.id);
      return res.status(400).json({ error: 'This code has expired. Please request a new one.' });
    }
    if (otp.attempts >= OTP_CONFIG.maxAttempts) {
      await markOtpVerified(otp.id);
      return res.status(429).json({ error: 'Too many attempts. Please wait and request a new code.' });
    }

    if (!verifyOtpCode(code, otp.code_hash)) {
      await incrementOtpAttempts(otp.id);
      const remaining = OTP_CONFIG.maxAttempts - (otp.attempts + 1);
      const msg =
        remaining <= 0
          ? 'Too many attempts. Please wait and request a new code.'
          : `That code is incorrect. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`;
      return res.status(400).json({ error: msg });
    }

    await markOtpVerified(otp.id);
    await deleteOtpsForEmail(email);
    await setUserEmailVerified(email);

    const pending = await getPendingSignup(email);
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
        await deletePendingSignup(email);
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
      await touchUser(user.id);
      await deletePendingSignup(email);
    }

    const token = issueToken(user);
    res.json({ ok: true, token, user: toPublicUser(user), isNew });
  } catch (err) {
    next(err);
  }
});