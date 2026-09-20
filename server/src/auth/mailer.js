/**
 * ScamShield AI — Transactional email (Brevo).
 *
 * Provider selection (EMAIL_PROVIDER, auto-detected if unset):
 *   brevo   → Brevo transactional API (production path). Needs BREVO_API_KEY.
 *             Sent server-side via https://api.brevo.com/v3/smtp/email — the
 *             API key is NEVER exposed to the frontend.
 *   smtp    → Nodemailer over SMTP (alternative). Needs SMTP_HOST/USER/PASS.
 *   console → dev only: the message is logged to the server console. Never a
 *             disguised production mock — codes/links are never returned in an
 *             API response.
 *
 * We use fetch() against Brevo's REST API rather than an SDK to keep the
 * dependency surface small.
 */
import nodemailer from 'nodemailer';

const BREVO_CONFIGURED = Boolean(process.env.BREVO_API_KEY);
const SMTP_CONFIGURED = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const EMAIL_PROVIDER = (
  process.env.EMAIL_PROVIDER ||
  (BREVO_CONFIGURED ? 'brevo' : SMTP_CONFIGURED ? 'smtp' : 'console')
).toLowerCase();

// Sender must be a Brevo-verified sender/domain in production.
const EMAIL_FROM = process.env.EMAIL_FROM || 'ScamShield AI <no-reply@scamshield.app>';

// Parse "Name <email@domain>" into Brevo's { name, email } sender object.
function parseSender(from) {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(from);
  if (match) return { name: match[1] || 'ScamShield AI', email: match[2].trim() };
  return { name: 'ScamShield AI', email: from.trim() };
}

let transporter = null;
if (EMAIL_PROVIDER === 'smtp' && SMTP_CONFIGURED) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export function emailChannel() {
  if (EMAIL_PROVIDER === 'brevo' && BREVO_CONFIGURED) return 'brevo';
  if (EMAIL_PROVIDER === 'smtp' && transporter) return 'smtp';
  return 'console';
}

export function isEmailDeliverable() {
  return emailChannel() !== 'console';
}

// ─── Low-level send ────────────────────────────────────────────────────────

async function sendViaBrevo({ to, subject, html, text }) {
  const sender = parseSender(EMAIL_FROM);
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
    signal: AbortSignal.timeout(Number(process.env.EMAIL_TIMEOUT_MS) || 15000),
  });
  if (!res.ok) {
    // Read Brevo's error but NEVER surface it (or the key) to the client.
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo delivery failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return { delivered: true, channel: 'brevo' };
}

async function sendEmail({ to, subject, html, text }) {
  if (EMAIL_PROVIDER === 'brevo' && BREVO_CONFIGURED) {
    return sendViaBrevo({ to, subject, html, text });
  }
  if (EMAIL_PROVIDER === 'smtp' && transporter) {
    await transporter.sendMail({ from: EMAIL_FROM, to, subject, html, text });
    return { delivered: true, channel: 'smtp' };
  }
  // Dev/console fallback — only when no provider is configured.
  console.log(`[mailer][dev] email to ${to} — subject: ${subject}\n${text}`);
  return { delivered: false, channel: 'console' };
}

// ─── Templates ───────────────────────────────────────────────────────────────

function shell(inner) {
  return `
    <div style="background:#04060a;padding:32px;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0">
      <div style="max-width:460px;margin:0 auto;background:#0b0f18;border:1px solid rgba(255,255,255,.12);border-radius:16px;overflow:hidden">
        <div style="padding:20px 28px;border-bottom:1px solid rgba(255,255,255,.08)">
          <span style="font-weight:700;letter-spacing:.2em;color:#22d3ee">SCAMSHIELD AI</span>
        </div>
        <div style="padding:28px">${inner}</div>
      </div>
    </div>`;
}

function otpHtml({ code, expiresMinutes }) {
  return shell(`
    <h1 style="font-size:18px;margin:0 0 12px">Your verification code</h1>
    <p style="font-size:14px;color:#94a3b8;margin:0 0 20px">
      Use the code below to finish signing in. It expires in <strong>${expiresMinutes} minutes</strong>.
    </p>
    <div style="font-size:32px;letter-spacing:10px;font-weight:700;color:#fff;background:rgba(34,211,238,.08);border:1px solid rgba(34,211,238,.25);border-radius:12px;padding:18px;text-align:center">
      ${code}
    </div>
    <p style="font-size:12px;color:#64748b;margin:20px 0 0;line-height:1.6">
      If you didn't request this code, you can safely ignore this email.
    </p>`);
}

function verifyHtml({ verifyUrl, expiresMinutes }) {
  return shell(`
    <h1 style="font-size:18px;margin:0 0 12px">Verify your email</h1>
    <p style="font-size:14px;color:#94a3b8;margin:0 0 22px;line-height:1.6">
      Thanks for creating your ScamShield AI account. Please confirm your email address by clicking the button below.
    </p>
    <div style="text-align:center;margin:0 0 22px">
      <a href="${verifyUrl}" style="display:inline-block;background:#22d3ee;color:#04060a;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:14px">
        Verify My Email
      </a>
    </div>
    <p style="font-size:12px;color:#64748b;margin:0 0 6px;line-height:1.6">
      This link expires in <strong>${expiresMinutes} minutes</strong> and can be used once.
    </p>
    <p style="font-size:12px;color:#64748b;margin:0;line-height:1.6">
      If you didn't create this account, you can safely ignore this email.
    </p>`);
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Send the OTP verification code. Returns the delivery channel.
 * The code is never returned in any API response.
 */
export async function sendVerificationEmail({ to, code, expiresMinutes }) {
  return sendEmail({
    to,
    subject: 'Your ScamShield AI Verification Code',
    html: otpHtml({ code, expiresMinutes }),
    text: [
      'Your ScamShield AI verification code is:',
      '',
      code,
      '',
      `This code expires in ${expiresMinutes} minutes.`,
      'If you did not request this code, you can safely ignore this email.',
    ].join('\n'),
  });
}

/**
 * Send the clickable email-verification link. The raw token is embedded in the
 * URL only — it is never stored in plain text server-side.
 */
export async function sendEmailVerificationLink({ to, verifyUrl, expiresMinutes }) {
  return sendEmail({
    to,
    subject: 'Verify your ScamShield AI email',
    html: verifyHtml({ verifyUrl, expiresMinutes }),
    text: [
      'Hello,',
      '',
      'Thanks for creating your ScamShield AI account.',
      'Please verify your email address by opening the link below:',
      '',
      verifyUrl,
      '',
      `This verification link expires in ${expiresMinutes} minutes and can be used once.`,
      'If you did not create this account, you can safely ignore this email.',
      '',
      '— ScamShield AI',
    ].join('\n'),
  });
}
