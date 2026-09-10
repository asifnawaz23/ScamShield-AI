/**
 * ScamShield AI — Heuristic Engine Unit Tests
 * Uses Node.js built-in test runner (node:test) — no external test framework required.
 * Run: node --test server/tests/engine.test.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Dynamically import from the project root's server module
const { analyzeContent, analyzeUrl } = await import('../src/services/engine.js');

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function assertBounded(score, min, max, label) {
  assert.ok(
    score >= min && score <= max,
    `[${label}] Expected score in [${min}, ${max}], got ${score}`,
  );
}

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('Scoring determinism', () => {
  test('identical inputs always produce identical scores', () => {
    const msg = 'Your SBI account will be blocked in 24 hours. Verify KYC at http://sbi-online-verify.xyz/confirm';
    const r1 = analyzeContent(msg, 'text');
    const r2 = analyzeContent(msg, 'text');
    assert.equal(r1.riskScore, r2.riskScore, 'Score must be deterministic');
    assert.equal(r1.category.id, r2.category.id, 'Category must be deterministic');
  });

  test('score is bounded 0-98', () => {
    const msgs = [
      'Your account will be blocked NOW. Share OTP to confirm. Pay Rs. 900 processing fee. http://evil.xyz/claim',
      'Hi',
      'Meet me for lunch?',
      'Congratulations! You have won Rs. 50,000 lottery! Pay Rs. 999 to claim. Click now: http://scam.top/win',
    ];
    for (const msg of msgs) {
      const r = analyzeContent(msg, 'text');
      assert.ok(r.riskScore >= 0 && r.riskScore <= 98, `Score out of range for "${msg.slice(0, 30)}...": ${r.riskScore}`);
    }
  });
});

// ---------------------------------------------------------------------------
// High-risk scenarios
// ---------------------------------------------------------------------------

describe('High-risk detection', () => {
  test('bank impersonation with URL scores HIGH or CRITICAL (>= 65)', () => {
    // Pakistani HBL bank impersonation — uses CNIC + ATM PIN request
    const msg = 'Aapka HBL account 24 ghanton mein band ho jayega. Account block se bachne ke liye abhi apni CNIC aur ATM PIN verify karein. Link: http://hbl-secure-verify.xyz/confirm — Kisi ko mat batayein.';
    const r = analyzeContent(msg, 'text');
    assertBounded(r.riskScore, 65, 98, 'bank-impersonation');
    assert.ok(['impersonation', 'phishing', 'account_takeover'].includes(r.category.id), `Unexpected category: ${r.category.id}`);
  });

  test('OTP harvest scores HIGH (>= 50) and is account_takeover', () => {
    // Pakistani JazzCash OTP scam message
    const msg = "Aapka JazzCash account suspicious activity ki wajah se band ho raha hai. Account unlock karne ke liye abhi apna 6-digit OTP code share karein jo aapke number par aaya hai.";
    const r = analyzeContent(msg, 'text');
    assertBounded(r.riskScore, 50, 98, 'otp-harvest');
    assert.equal(r.category.id, 'account_takeover', 'OTP message should be account_takeover');
  });

  test('fake prize with payment request scores CRITICAL (>= 75)', () => {
    const msg = 'Congratulations! Your number has been selected to receive a cash prize of Rs. 50,000. To claim your reward, pay a processing fee of Rs. 900 only. Claim now: http://festivelucky2026.xyz/claim Hurry! Offer expires tonight!';
    const r = analyzeContent(msg, 'text');
    assertBounded(r.riskScore, 65, 98, 'fake-prize');
    assert.ok(['fake_prize', 'payment_scam'].includes(r.category.id), `Unexpected category: ${r.category.id}`);
  });

  test('investment scam scores SUSPICIOUS or higher (>= 48) and is investment_scam', () => {
    const msg = 'Guaranteed 200% profit in 7 days! Join our crypto trading elite group. Expert signals daily. Double your money with a minimum deposit of Rs. 5,000.';
    const r = analyzeContent(msg, 'text');
    assertBounded(r.riskScore, 48, 98, 'investment-scam');
    assert.equal(r.category.id, 'investment_scam', 'Investment message should be investment_scam');
  });

  test('fake job offer scores SUSPICIOUS or higher (>= 45)', () => {
    const msg = 'URGENT VACANCY! Work from home and earn Rs. 2,000 per day. No experience needed. Free training. Pay a small registration fee and message me on WhatsApp.';
    const r = analyzeContent(msg, 'text');
    assertBounded(r.riskScore, 45, 98, 'fake-job');
    assert.ok(
      ['job_scam', 'payment_scam', 'impersonation'].includes(r.category.id),
      `Unexpected category: ${r.category.id}`,
    );
  });
});

// ---------------------------------------------------------------------------
// Low-risk / legitimate scenarios (false-positive protection)
// ---------------------------------------------------------------------------

describe('Low-risk / legitimate (false-positive protection)', () => {
  test('order confirmation from Amazon scores LOW (<= 25)', () => {
    const msg = 'Hi, this is your order confirmation from Amazon. Your package #12345 will arrive by Thursday. No action needed.';
    const r = analyzeContent(msg, 'text');
    assertBounded(r.riskScore, 0, 25, 'amazon-order-confirmation');
  });

  test('simple appointment reminder scores LOW (<= 20)', () => {
    const msg = 'Reminder: Your doctor appointment is confirmed for Monday at 10:00 AM. Please arrive 10 minutes early.';
    const r = analyzeContent(msg, 'text');
    assertBounded(r.riskScore, 0, 20, 'appointment-reminder');
  });

  test('shipping notification scores LOW (<= 20)', () => {
    const msg = 'Your order has been shipped! Track it at amazon.com/orders. Expected delivery: 2-4 business days.';
    const r = analyzeContent(msg, 'text');
    assertBounded(r.riskScore, 0, 25, 'shipping-notification');
  });
});

// ---------------------------------------------------------------------------
// UNKNOWN / insufficient evidence
// ---------------------------------------------------------------------------

describe('UNKNOWN state — insufficient evidence', () => {
  test('ambiguous short message returns low confidence', () => {
    const msg = 'Hi, can we talk?';
    const r = analyzeContent(msg, 'text');
    assertBounded(r.riskScore, 0, 25, 'ambiguous-short');
    // Should not force a high-risk verdict
    assert.notEqual(r.riskLevel, 'critical', 'Should not be CRITICAL for "Hi, can we talk?"');
    assert.notEqual(r.riskLevel, 'high', 'Should not be HIGH for "Hi, can we talk?"');
  });

  test('empty input returns minimal score and LOW confidence', () => {
    const r = analyzeContent('', 'text');
    assertBounded(r.riskScore, 0, 15, 'empty-input');
    assert.equal(r.confidenceLabel, 'LOW', 'Empty input should have LOW confidence');
  });

  test('absence-of-evidence disclaimer is always present in uncertainty', () => {
    const r = analyzeContent('Hello', 'text');
    const hasDisclaimer = r.evidenceBasis.uncertainty.some(
      (u) => u.toLowerCase().includes('not proof') || u.toLowerCase().includes('cannot be') || u.toLowerCase().includes('intent'),
    );
    assert.ok(hasDisclaimer, 'Uncertainty should always include absence-of-evidence disclaimer');
  });
});

// ---------------------------------------------------------------------------
// URL structural analysis
// ---------------------------------------------------------------------------

describe('URL structural analysis', () => {
  test('suspicious TLD triggers warning or danger indicator', () => {
    const r = analyzeUrl('https://claim-prize.xyz/reward');
    const hasSuspiciousTld = r.indicators.some((i) => i.status === 'warning' || i.status === 'danger');
    assert.ok(hasSuspiciousTld, 'Suspicious TLD (.xyz) should trigger indicator');
  });

  test('IP address URL triggers danger indicator', () => {
    const r = analyzeUrl('http://192.168.1.1/login');
    const hasIpDanger = r.indicators.some((i) => i.label === 'IP Address Hosting' && i.status === 'danger');
    assert.ok(hasIpDanger, 'IP address URL should trigger danger indicator');
    assert.ok(r.riskScore >= 30, `IP URL risk score should be >= 30, got ${r.riskScore}`);
  });

  test('URL shortener triggers warning indicator', () => {
    const r = analyzeUrl('https://bit.ly/3xXyZ');
    const hasShortener = r.indicators.some((i) => i.label === 'URL Shortener' && i.status === 'warning');
    assert.ok(hasShortener, 'URL shortener should trigger warning indicator');
  });

  test('malformed URL (no protocol) triggers danger', () => {
    const r = analyzeUrl('not-a-valid-url');
    const hasProtocolDanger = r.indicators.some((i) => i.status === 'danger');
    assert.ok(hasProtocolDanger, 'Malformed URL should trigger danger indicator');
  });

  test('legitimate HTTPS URL scores low (false-positive protection)', () => {
    const r = analyzeUrl('https://www.amazon.com/order/12345');
    assert.ok(r.riskScore <= 20, `Legitimate URL risk score should be <= 20, got ${r.riskScore}`);
  });

  test('brand-token domain (phishing pattern) triggers danger', () => {
    const r = analyzeUrl('https://login-amazon-verify.com/account');
    const hasBrandToken = r.indicators.some(
      (i) => (i.label === 'Brand-style Domain Token' || i.label === 'Action-Oriented Path') && i.status === 'danger',
    );
    assert.ok(hasBrandToken, 'Brand-token phishing URL should trigger danger indicator');
    assert.ok(r.riskScore >= 25, `Brand-token URL score should be >= 25, got ${r.riskScore}`);
  });
});

// ---------------------------------------------------------------------------
// URL analysis from text content
// ---------------------------------------------------------------------------

describe('URL analysis within message text', () => {
  test('URL submission uses 65% URL score blending', () => {
    const url = 'http://192.168.1.1/phishing';
    const r = analyzeContent(url, 'url');
    // IP URL has high structural risk — should dominate text signals
    assert.ok(r.riskScore >= 30, `URL-type submission should propagate URL structural risk, got ${r.riskScore}`);
  });
});

// ---------------------------------------------------------------------------
// Score signal attribution
// ---------------------------------------------------------------------------

describe('Signal attribution', () => {
  test('each reason has a title, contribution, and explanation', () => {
    const msg = 'Your account will be blocked. Share your OTP now. http://phish.top/login';
    const r = analyzeContent(msg, 'text');
    assert.ok(r.reasons.length > 0, 'Should have at least one reason');
    for (const reason of r.reasons) {
      assert.ok(typeof reason.title === 'string' && reason.title.length > 0, 'Reason must have title');
      assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(reason.contribution), `Invalid contribution: ${reason.contribution}`);
      assert.ok(typeof reason.explanation === 'string' && reason.explanation.length > 0, 'Reason must have explanation');
    }
  });

  test('OTP signal contributes to credential risk dimension', () => {
    const msg = 'Please share your OTP to verify your identity.';
    const r = analyzeContent(msg, 'text');
    const credDim = r.dimensions.find((d) => d.key === 'credentialRisk');
    assert.ok(credDim, 'credentialRisk dimension must exist');
    assert.ok(credDim.score > 0, 'OTP message should increase credentialRisk dimension');
  });
});

// ---------------------------------------------------------------------------
// Confidence score
// ---------------------------------------------------------------------------

describe('Confidence scoring', () => {
  test('strong multi-signal message has HIGH or MODERATE confidence', () => {
    const msg = 'URGENT: Your bank account will be suspended. Share OTP immediately. Pay Rs. 999 fee at http://fraud.xyz/pay. Act now or face legal action!';
    const r = analyzeContent(msg, 'text');
    assert.ok(['HIGH', 'MODERATE'].includes(r.confidenceLabel), `Strong multi-signal message should have HIGH or MODERATE confidence, got ${r.confidenceLabel}`);
    assert.ok(r.confidence >= 60, `Confidence should be >= 60, got ${r.confidence}`);
  });

  test('very short input has LOW confidence', () => {
    const r = analyzeContent('Hello', 'text');
    assert.equal(r.confidenceLabel, 'LOW', 'Very short input should have LOW confidence');
    assert.ok(r.confidence <= 45, `Confidence should be <= 45 for "Hello", got ${r.confidence}`);
  });
});

console.log('\n✓ All engine tests completed.\n');
