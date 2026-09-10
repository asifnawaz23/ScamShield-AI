import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const RESEND_CONFIGURED = Boolean(process.env.RESEND_API_KEY);
const SMTP_CONFIGURED = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const EMAIL_PROVIDER = (
  process.env.EMAIL_PROVIDER ||
  (RESEND_CONFIGURED ? 'resend' : SMTP_CONFIGURED ? 'smtp' : 'console')
).toLowerCase();
const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  'ScamShield AI <onboarding@resend.dev>';

let transporter = null;
let resend = null;

if (EMAIL_PROVIDER === 'resend' && RESEND_CONFIGURED) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else if (EMAIL_PROVIDER === 'smtp' && SMTP_CONFIGURED) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export function emailChannel() {
  return resend ? 'resend' : transporter ? 'smtp' : 'console';
}

export function isEmailDeliverable() {
  return Boolean(resend || transporter);
}

function buildHtml({ code, expiresMinutes }) {
  return `
    <div style="background:#04060a;padding:32px;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0">
      <div style="max-width:440px;margin:0 auto;background:#0b0f18;border:1px solid rgba(255,255,255,.12);border-radius:16px;overflow:hidden">
        <div style="padding:20px 28px;border-bottom:1px solid rgba(255,255,255,.08)">
          <span style="font-weight:700;letter-spacing:.2em;color:#22d3ee">SCAMSHIELD AI</span>
        </div>
        <div style="padding:28px">
          <h1 style="font-size:18px;margin:0 0 12px">Your verification code</h1>
          <p style="font-size:14px;color:#94a3b8;margin:0 0 20px">
            Use the code below to finish signing in. It expires in
            <strong>${expiresMinutes} minutes</strong>.
          </p>
          <div style="font-size:32px;letter-spacing:10px;font-weight:700;color:#ffffff;background:rgba(34,211,238,.08);border:1px solid rgba(34,211,238,.25);border-radius:12px;padding:18px;text-align:center">
            ${code}
          </div>
          <p style="font-size:12px;color:#64748b;margin:20px 0 0;line-height:1.6">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      </div>
    </div>
  `;
}

function buildText({ code, expiresMinutes }) {
  return [
    'Your ScamShield AI verification code is:',
    '',
    code,
    '',
    `This code expires in ${expiresMinutes} minutes.`,
    'If you did not request this code, you can safely ignore this email.',
  ].join('\n');
}

/**
 * Sends the verification code. Returns the delivery channel.
 * Resend (or SMTP) is the production path. When no provider is configured the
 * code is printed to the server console only — this is a development convenience,
 * never a disguised production mock. The code is never returned in any API response.
 */
export async function sendVerificationEmail({ to, code, expiresMinutes }) {
  if (EMAIL_PROVIDER === 'resend' && resend) {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Your ScamShield AI Verification Code',
      text: buildText({ code, expiresMinutes }),
      html: buildHtml({ code, expiresMinutes }),
    });
    if (error) throw new Error(`Resend delivery failed: ${error.message}`);
    return { delivered: true, channel: 'resend' };
  }

  if (EMAIL_PROVIDER === 'smtp' && transporter) {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject: 'Your ScamShield AI Verification Code',
      text: buildText({ code, expiresMinutes }),
      html: buildHtml({ code, expiresMinutes }),
    });
    return { delivered: true, channel: 'smtp' };
  }

  // Dev/console fallback — only active when no email provider is configured.
  console.log(`[mailer][dev] verification code for ${to}: ${code} (expires in ${expiresMinutes} minutes)`);
  return { delivered: false, channel: 'console' };
}