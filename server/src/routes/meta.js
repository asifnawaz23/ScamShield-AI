import { Router } from 'express';
import { getSeedScenarios, seedScenarios, listAnalyses, getAnalysis, deleteAnalysis, clearAnalyses } from '../db/db.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

export const metaRouter = Router();

const SCENARIOS = [
  {
    id: 'fake-prize',
    title: 'Fake Prize',
    type: 'fake_prize',
    icon: 'gift',
    message:
      'Congratulations! Your number has been selected to receive a cash prize of Rs. 50,000 in the "Festive Lucky Draw 2026". To claim your reward immediately, pay a small processing fee of Rs. 900 only. Claim now: http://festivelucky2026.xyz/claim Hurry! Offer expires tonight!',
  },
  {
    id: 'fake-job',
    title: 'Fake Job Offer',
    type: 'job_scam',
    icon: 'briefcase',
    message:
      'URGENT VACANCY! Work from home and earn Rs. 2,000 per day. No experience needed. Free training. To confirm your slot, pay a small registration fee and message me on WhatsApp at +91 98XXXXXX21. Limited seats available today only.',
  },
  {
    id: 'bank-impersonation',
    title: 'Bank Impersonation',
    type: 'impersonation',
    icon: 'landmark',
    message:
      'Your SBI account will be blocked within 24 hours unless you verify your identity. Login to update your KYC immediately: http://sbi-online-verify.xyz/confirm. Do not tell anyone about this. Your account will be blocked otherwise.',
  },
  {
    id: 'delivery-scam',
    title: 'Delivery Scam',
    type: 'delivery_scam',
    icon: 'package',
    message:
      'Your parcel from Amazon Express is pending at our facility. Release your package by paying a customs fee of Rs. 450. Reschedule now to avoid return. Track and pay here: http://amz-parcel.top/track',
  },
  {
    id: 'investment-scam',
    title: 'Investment Scam',
    type: 'investment_scam',
    icon: 'trending',
    message:
      'Guaranteed 200% profit in 7 days! Join our crypto trading elite group. Expert signals daily. Double your money with a minimum deposit of Rs. 5,000. Limited slots for early investors. Act now!',
  },
  {
    id: 'account-verification',
    title: 'Account Verification / OTP',
    type: 'account_takeover',
    icon: 'key',
    message:
      "Your Paytm account has been flagged for suspicious activity. OTP 482913 has been sent to your number. Share this OTP to confirm it's you and unlock your account immediately.",
  },
];

seedScenarios(SCENARIOS);

metaRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'scamshield-api',
    status: 'healthy',
    mode: process.env.AI_API_KEY ? 'ai' : 'demo',
    time: new Date().toISOString(),
  });
});

metaRouter.get('/demo-scenarios', (_req, res) => {
  res.json({ ok: true, scenarios: getSeedScenarios().map((s) => ({
    id: s.id, title: s.title, type: s.type, icon: s.icon, message: s.message,
  })) });
});

metaRouter.get('/history', optionalAuth, (_req, res) => {
  const items = _req.user ? listAnalyses(_req.user.id) : [];
  res.json({ ok: true, items });
});

metaRouter.get('/history/:id', (req, res) => {
  const item = getAnalysis(req.params.id);
  if (!item) return res.status(404).json({ error: 'Analysis not found.' });
  res.json({ ok: true, analysis: item });
});

metaRouter.delete('/history/:id', requireAuth, (req, res) => {
  deleteAnalysis(req.params.id, req.user.id);
  res.json({ ok: true });
});

metaRouter.delete('/history', requireAuth, (req, res) => {
  clearAnalyses(req.user.id);
  res.json({ ok: true });
});