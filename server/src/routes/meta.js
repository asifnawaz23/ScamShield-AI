import { Router } from 'express';
import { getSeedScenarios, seedScenarios, listAnalyses, getAnalysis, deleteAnalysis, clearAnalyses } from '../db/db.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

export const metaRouter = Router();

const SCENARIOS = [
  {
    id: 'hbl-impersonation',
    title: 'HBL Bank Impersonation',
    type: 'impersonation',
    icon: 'landmark',
    message:
      'Aapka HBL account 24 ghanton mein band ho jayega. Account block se bachne ke liye abhi apni CNIC aur ATM PIN verify karein. Link: http://hbl-secure-verify.xyz/confirm — Kisi ko mat batayein.',
  },
  {
    id: 'bisp-welfare-scam',
    title: 'BISP / Ehsaas Scam',
    type: 'welfarescam',
    icon: 'gift',
    message:
      'Pakistan Government ki taraf se khush khabri! Aapka Ehsaas Program mein Rs. 25,000 ki raqam tayar hai. Abhi apna CNIC number aur registered mobile number 8171 par bhejein aur apni raqam hasil karein. Jaldi karein, offer aaj raat tak valid hai.',
  },
  {
    id: 'jazzcash-otp-scam',
    title: 'JazzCash OTP Theft',
    type: 'account_takeover',
    icon: 'key',
    message:
      "Aapka JazzCash account suspicious activity ki wajah se band ho raha hai. Account unlock karne ke liye abhi apna 6-digit OTP code share karein jo aapke number par aaya hai. Customer care: +92 300 1234567 par WhatsApp karein.",
  },
  {
    id: 'fake-job-pakistan',
    title: 'Fake Online Job Offer',
    type: 'job_scam',
    icon: 'briefcase',
    message:
      'URGENT VACANCY! Ghar baithe kaam karein aur rozana Rs. 3,000 kamayen. Koi experience zaroori nahi. Sirf YouTube videos like aur subscribe karein. Pehle Rs. 500 registration fee JazzCash 0300-1234567 par bhejen. Limited seats — aaj hi enroll karein!',
  },
  {
    id: 'nadra-cnic-scam',
    title: 'NADRA CNIC Verification Scam',
    type: 'account_takeover',
    icon: 'key',
    message:
      'NADRA ki taraf se notice: Aapka CNIC expire ho chuka hai aur aapki SIM 48 ghanton mein PTA ki taraf se block ho jayegi. Apna CNIC renew karne ke liye is link par click karein aur apni CNIC copy upload karein: http://nadra-cnic-update.online/verify',
  },
  {
    id: 'forex-investment-scam',
    title: 'Forex / Crypto Investment Scam',
    type: 'investment_scam',
    icon: 'trending',
    message:
      'Pakistan ka #1 Forex Trading Group! Expert signals se guaranteed 150% weekly return. Sirf Rs. 10,000 se shuru karein aur ek hafte mein double karein. Limited slots — aaj hi WhatsApp karein: +92 321 9876543. Bitcoin, USDT, JazzCash sab accept hai.',
  },
];

// Seed demo scenarios once, behind a shared promise so concurrent serverless
// requests don't race. Called from the app's DB-readiness gate (after initDb).
let seedPromise = null;
export function ensureScenariosSeeded() {
  if (!seedPromise) {
    seedPromise = seedScenarios(SCENARIOS).catch((err) => {
      seedPromise = null; // allow a retry on next request if it failed
      console.error('[meta] seed scenarios failed:', err.message);
    });
  }
  return seedPromise;
}

metaRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'scamshield-api',
    status: 'healthy',
    mode: process.env.AI_API_KEY ? 'ai' : 'demo',
    time: new Date().toISOString(),
  });
});

metaRouter.get('/demo-scenarios', async (_req, res, next) => {
  try {
    const scenarios = await getSeedScenarios();
    res.json({
      ok: true,
      scenarios: scenarios.map((s) => ({
        id: s.id, title: s.title, type: s.type, icon: s.icon, message: s.message,
      })),
    });
  } catch (err) {
    next(err);
  }
});

metaRouter.get('/history', optionalAuth, async (req, res, next) => {
  try {
    const items = req.user ? await listAnalyses(req.user.id) : [];
    res.json({ ok: true, items });
  } catch (err) {
    next(err);
  }
});

// SECURITY: ownership-enforced. requireAuth guarantees req.user, and
// getAnalysis(id, userId) only returns a row that belongs to that user.
// This closes the IDOR where any UUID holder could read any report.
metaRouter.get('/history/:id', requireAuth, async (req, res, next) => {
  try {
    const item = await getAnalysis(req.params.id, req.user.id);
    if (!item) return res.status(404).json({ error: 'Analysis not found.' });
    res.json({ ok: true, analysis: item });
  } catch (err) {
    next(err);
  }
});

metaRouter.delete('/history/:id', requireAuth, async (req, res, next) => {
  try {
    await deleteAnalysis(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

metaRouter.delete('/history', requireAuth, async (req, res, next) => {
  try {
    await clearAnalyses(req.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});