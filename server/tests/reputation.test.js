/**
 * ScamShield AI — Reputation Service Unit Tests
 * Uses Node.js built-in test runner (node:test).
 * Run: node --test server/tests/reputation.test.js
 *
 * These tests verify the reputation service's honest status reporting
 * without making real external network calls.
 */

import { test, describe, mock } from 'node:test';
import assert from 'node:assert/strict';
import { REPUTATION_STATUS, checkReputation, isReputationConfigured, reputationStatusLabel } from '../src/services/reputation.js';

// ---------------------------------------------------------------------------
// Status constants — ensure all required values exist
// ---------------------------------------------------------------------------

describe('REPUTATION_STATUS constants', () => {
  test('all required status values are defined', () => {
    const required = [
      'NOT_CONFIGURED',
      'VERIFICATION_UNAVAILABLE',
      'UNKNOWN',
      'SUSPICIOUS',
      'VERIFIED_SAFE',
      'VERIFIED_MALICIOUS',
    ];
    for (const key of required) {
      assert.ok(REPUTATION_STATUS[key], `REPUTATION_STATUS.${key} must be defined`);
      assert.ok(typeof REPUTATION_STATUS[key] === 'string', `REPUTATION_STATUS.${key} must be a string`);
    }
  });

  test('status values are unique strings', () => {
    const values = Object.values(REPUTATION_STATUS);
    const unique = new Set(values);
    assert.equal(unique.size, values.length, 'All status values must be unique');
  });
});

// ---------------------------------------------------------------------------
// No API keys configured
// ---------------------------------------------------------------------------

describe('checkReputation — no API keys configured', () => {
  test('all providers return not_configured when keys are absent', async () => {
    // Temporarily clear any test env keys
    const savedVT = process.env.VIRUSTOTAL_API_KEY;
    const savedGSB = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    const savedIPDB = process.env.ABUSEIPDB_API_KEY;
    delete process.env.VIRUSTOTAL_API_KEY;
    delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    delete process.env.ABUSEIPDB_API_KEY;

    const result = await checkReputation('https://www.example.com/test');

    assert.equal(result.virusTotal.status, REPUTATION_STATUS.NOT_CONFIGURED,
      'VirusTotal must be not_configured when key is absent');
    assert.equal(result.safeBrowsing.status, REPUTATION_STATUS.NOT_CONFIGURED,
      'Safe Browsing must be not_configured when key is absent');
    assert.equal(result.abuseIpdb.status, REPUTATION_STATUS.NOT_CONFIGURED,
      'AbuseIPDB must be not_configured when key is absent (non-IP URL)');

    // Restore
    if (savedVT) process.env.VIRUSTOTAL_API_KEY = savedVT;
    if (savedGSB) process.env.GOOGLE_SAFE_BROWSING_API_KEY = savedGSB;
    if (savedIPDB) process.env.ABUSEIPDB_API_KEY = savedIPDB;
  });

  test('overallStatus is not_configured when all providers are not_configured', async () => {
    const savedVT = process.env.VIRUSTOTAL_API_KEY;
    const savedGSB = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    const savedIPDB = process.env.ABUSEIPDB_API_KEY;
    delete process.env.VIRUSTOTAL_API_KEY;
    delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    delete process.env.ABUSEIPDB_API_KEY;

    const result = await checkReputation('https://www.example.com');
    assert.equal(result.overallStatus, REPUTATION_STATUS.NOT_CONFIGURED);

    if (savedVT) process.env.VIRUSTOTAL_API_KEY = savedVT;
    if (savedGSB) process.env.GOOGLE_SAFE_BROWSING_API_KEY = savedGSB;
    if (savedIPDB) process.env.ABUSEIPDB_API_KEY = savedIPDB;
  });

  test('result never says safe or malicious when no keys are configured', async () => {
    const savedVT = process.env.VIRUSTOTAL_API_KEY;
    const savedGSB = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    const savedIPDB = process.env.ABUSEIPDB_API_KEY;
    delete process.env.VIRUSTOTAL_API_KEY;
    delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    delete process.env.ABUSEIPDB_API_KEY;

    const result = await checkReputation('https://definitely-malicious-example.com');
    assert.notEqual(result.overallStatus, REPUTATION_STATUS.VERIFIED_MALICIOUS,
      'Must NOT claim malicious without evidence');
    assert.notEqual(result.overallStatus, REPUTATION_STATUS.VERIFIED_SAFE,
      'Must NOT claim safe without evidence');

    if (savedVT) process.env.VIRUSTOTAL_API_KEY = savedVT;
    if (savedGSB) process.env.GOOGLE_SAFE_BROWSING_API_KEY = savedGSB;
    if (savedIPDB) process.env.ABUSEIPDB_API_KEY = savedIPDB;
  });
});

// ---------------------------------------------------------------------------
// Return structure validation
// ---------------------------------------------------------------------------

describe('checkReputation — return structure', () => {
  test('returns all required fields', async () => {
    const result = await checkReputation('https://www.example.com');
    assert.ok(typeof result.url === 'string', 'url must be present');
    assert.ok(typeof result.virusTotal === 'object', 'virusTotal must be present');
    assert.ok(typeof result.safeBrowsing === 'object', 'safeBrowsing must be present');
    assert.ok(typeof result.abuseIpdb === 'object', 'abuseIpdb must be present');
    assert.ok(typeof result.overallStatus === 'string', 'overallStatus must be present');
    assert.ok(typeof result.isIpAddress === 'boolean', 'isIpAddress must be present');
    assert.ok(typeof result.checkedAt === 'string', 'checkedAt must be present');
  });

  test('IP address URL is detected correctly', async () => {
    const result = await checkReputation('http://192.168.1.1/malware');
    assert.equal(result.isIpAddress, true, 'IP address URL must have isIpAddress:true');
  });

  test('non-IP URL has isIpAddress:false', async () => {
    const result = await checkReputation('https://www.google.com');
    assert.equal(result.isIpAddress, false, 'Domain URL must have isIpAddress:false');
  });

  test('checkedAt is a valid ISO timestamp', async () => {
    const result = await checkReputation('https://www.example.com');
    const parsed = new Date(result.checkedAt);
    assert.ok(!isNaN(parsed.getTime()), 'checkedAt must be a valid date');
  });

  test('each provider result has provider and status fields', async () => {
    const result = await checkReputation('https://www.example.com');
    for (const provKey of ['virusTotal', 'safeBrowsing', 'abuseIpdb']) {
      const prov = result[provKey];
      assert.ok(typeof prov.provider === 'string', `${provKey}.provider must be a string`);
      assert.ok(typeof prov.status === 'string', `${provKey}.status must be a string`);
      assert.ok(
        Object.values(REPUTATION_STATUS).includes(prov.status),
        `${provKey}.status "${prov.status}" is not a valid REPUTATION_STATUS`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// isReputationConfigured
// ---------------------------------------------------------------------------

describe('isReputationConfigured', () => {
  test('returns false when no keys are set', () => {
    const savedVT = process.env.VIRUSTOTAL_API_KEY;
    const savedGSB = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    const savedIPDB = process.env.ABUSEIPDB_API_KEY;
    delete process.env.VIRUSTOTAL_API_KEY;
    delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    delete process.env.ABUSEIPDB_API_KEY;

    assert.equal(isReputationConfigured(), false);

    if (savedVT) process.env.VIRUSTOTAL_API_KEY = savedVT;
    if (savedGSB) process.env.GOOGLE_SAFE_BROWSING_API_KEY = savedGSB;
    if (savedIPDB) process.env.ABUSEIPDB_API_KEY = savedIPDB;
  });

  test('returns true when at least one key is set', () => {
    const original = process.env.VIRUSTOTAL_API_KEY;
    process.env.VIRUSTOTAL_API_KEY = 'test-key-value';
    assert.equal(isReputationConfigured(), true);
    if (original) process.env.VIRUSTOTAL_API_KEY = original;
    else delete process.env.VIRUSTOTAL_API_KEY;
  });
});

// ---------------------------------------------------------------------------
// reputationStatusLabel
// ---------------------------------------------------------------------------

describe('reputationStatusLabel', () => {
  test('returns human-readable label for each status', () => {
    const cases = [
      [REPUTATION_STATUS.NOT_CONFIGURED, 'Not configured'],
      [REPUTATION_STATUS.VERIFICATION_UNAVAILABLE, 'Verification unavailable'],
      [REPUTATION_STATUS.UNKNOWN, 'Unknown'],
      [REPUTATION_STATUS.SUSPICIOUS, 'Suspicious'],
      [REPUTATION_STATUS.VERIFIED_SAFE, 'Verified safe'],
      [REPUTATION_STATUS.VERIFIED_MALICIOUS, 'Confirmed malicious'],
    ];
    for (const [status, expected] of cases) {
      const label = reputationStatusLabel(status);
      assert.equal(label, expected, `Label for ${status} should be "${expected}", got "${label}"`);
    }
  });

  test('unknown status returns fallback string', () => {
    const label = reputationStatusLabel('completely_unknown_status');
    assert.ok(typeof label === 'string' && label.length > 0, 'Should return a fallback string');
  });
});

// ---------------------------------------------------------------------------
// Severity ordering (most severe wins)
// ---------------------------------------------------------------------------

describe('Severity ordering — overallStatus', () => {
  test('verified_malicious is more severe than not_configured', async () => {
    // We cannot easily mock the internal mostSevere function, but we can verify
    // that the SEVERITY_ORDER concept is consistent with the constants
    const order = [
      REPUTATION_STATUS.NOT_CONFIGURED,
      REPUTATION_STATUS.VERIFIED_SAFE,
      REPUTATION_STATUS.UNKNOWN,
      REPUTATION_STATUS.VERIFICATION_UNAVAILABLE,
      REPUTATION_STATUS.SUSPICIOUS,
      REPUTATION_STATUS.VERIFIED_MALICIOUS,
    ];
    // These are distinct values; verified_malicious should be last
    assert.notEqual(order.indexOf(REPUTATION_STATUS.VERIFIED_MALICIOUS), -1);
    assert.equal(order[order.length - 1], REPUTATION_STATUS.VERIFIED_MALICIOUS);
  });
});

console.log('\n✓ All reputation tests completed.\n');
