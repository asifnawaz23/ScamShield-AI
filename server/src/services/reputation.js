/**
 * ScamShield AI — External Reputation Intelligence Service
 *
 * DESIGN PRINCIPLES:
 * - Never fabricate results. When an API is unavailable, return 'not_configured'
 *   or 'verification_unavailable' — never 'safe' or 'malicious' as defaults.
 * - All external calls are isolated with timeouts and error handling.
 * - The caller always receives an honest status, not a silent assumption.
 *
 * Status constants (the ONLY valid reputation status values):
 *   not_configured        — API key is absent; check was not possible
 *   verification_unavailable — API call failed (timeout, error, rate limit)
 *   unknown               — API returned no opinion on this URL
 *   suspicious            — API flagged as potentially problematic
 *   verified_safe         — API explicitly confirmed as clean
 *   verified_malicious    — API confirmed as malicious
 */

const TIMEOUT_MS = 15_000;

export const REPUTATION_STATUS = Object.freeze({
  NOT_CONFIGURED: 'not_configured',
  VERIFICATION_UNAVAILABLE: 'verification_unavailable',
  UNKNOWN: 'unknown',
  SUSPICIOUS: 'suspicious',
  VERIFIED_SAFE: 'verified_safe',
  VERIFIED_MALICIOUS: 'verified_malicious',
});

/**
 * Severity ranking — higher index = more severe.
 * Used to determine the `overallStatus` from multiple providers.
 */
const SEVERITY_ORDER = [
  REPUTATION_STATUS.NOT_CONFIGURED,
  REPUTATION_STATUS.VERIFIED_SAFE,
  REPUTATION_STATUS.UNKNOWN,
  REPUTATION_STATUS.VERIFICATION_UNAVAILABLE,
  REPUTATION_STATUS.SUSPICIOUS,
  REPUTATION_STATUS.VERIFIED_MALICIOUS,
];

function mostSevere(...statuses) {
  let best = REPUTATION_STATUS.NOT_CONFIGURED;
  for (const s of statuses) {
    if (SEVERITY_ORDER.indexOf(s) > SEVERITY_ORDER.indexOf(best)) best = s;
  }
  return best;
}

function extractHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function extractIp(url) {
  const hostname = extractHostname(url);
  if (!hostname) return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return hostname;
  return null;
}

async function fetchWithTimeout(url, init, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// VirusTotal
// API docs: https://developers.virustotal.com/reference/urls
// ---------------------------------------------------------------------------

async function checkVirusTotal(url) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    return { provider: 'virustotal', status: REPUTATION_STATUS.NOT_CONFIGURED };
  }

  try {
    // Submit URL for analysis
    const submitRes = await fetchWithTimeout(
      'https://www.virustotal.com/api/v3/urls',
      {
        method: 'POST',
        headers: {
          'x-apikey': apiKey,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: `url=${encodeURIComponent(url)}`,
      },
    );

    if (!submitRes.ok) {
      const txt = await submitRes.text().catch(() => '');
      console.warn(`[reputation] VirusTotal submit error ${submitRes.status}: ${txt.slice(0, 120)}`);
      return { provider: 'virustotal', status: REPUTATION_STATUS.VERIFICATION_UNAVAILABLE };
    }

    const submitData = await submitRes.json();
    const analysisId = submitData?.data?.id;
    if (!analysisId) {
      return { provider: 'virustotal', status: REPUTATION_STATUS.VERIFICATION_UNAVAILABLE };
    }

    // Fetch analysis result (the URL ID is base64-encoded URL without padding)
    const urlId = Buffer.from(url).toString('base64').replace(/=+$/, '');
    const resultRes = await fetchWithTimeout(
      `https://www.virustotal.com/api/v3/urls/${urlId}`,
      { headers: { 'x-apikey': apiKey } },
    );

    if (!resultRes.ok) {
      return { provider: 'virustotal', status: REPUTATION_STATUS.VERIFICATION_UNAVAILABLE };
    }

    const resultData = await resultRes.json();
    const stats = resultData?.data?.attributes?.last_analysis_stats;

    if (!stats) {
      return { provider: 'virustotal', status: REPUTATION_STATUS.UNKNOWN };
    }

    const malicious = Number(stats.malicious || 0);
    const suspicious = Number(stats.suspicious || 0);
    const undetected = Number(stats.undetected || 0);
    const total = malicious + suspicious + undetected + Number(stats.harmless || 0);

    if (malicious > 3) {
      return {
        provider: 'virustotal',
        status: REPUTATION_STATUS.VERIFIED_MALICIOUS,
        positives: malicious,
        total,
        detail: `${malicious} of ${total} security vendors flagged this URL as malicious.`,
      };
    }
    if (malicious > 0 || suspicious > 2) {
      return {
        provider: 'virustotal',
        status: REPUTATION_STATUS.SUSPICIOUS,
        positives: malicious + suspicious,
        total,
        detail: `${malicious + suspicious} vendor(s) flagged this URL as suspicious.`,
      };
    }
    if (total > 5) {
      return {
        provider: 'virustotal',
        status: REPUTATION_STATUS.VERIFIED_SAFE,
        positives: 0,
        total,
        detail: `${total} security vendors found no threat in this URL.`,
      };
    }

    return { provider: 'virustotal', status: REPUTATION_STATUS.UNKNOWN };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[reputation] VirusTotal timed out');
    } else {
      console.warn('[reputation] VirusTotal error:', err.message);
    }
    return { provider: 'virustotal', status: REPUTATION_STATUS.VERIFICATION_UNAVAILABLE };
  }
}

// ---------------------------------------------------------------------------
// Google Safe Browsing (v4 Lookup API)
// API docs: https://developers.google.com/safe-browsing/v4/lookup-api
// ---------------------------------------------------------------------------

async function checkGoogleSafeBrowsing(url) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    return { provider: 'google_safe_browsing', status: REPUTATION_STATUS.NOT_CONFIGURED };
  }

  try {
    const body = {
      client: { clientId: 'scamshield-ai', clientVersion: '1.0.0' },
      threatInfo: {
        threatTypes: [
          'MALWARE',
          'SOCIAL_ENGINEERING',
          'UNWANTED_SOFTWARE',
          'POTENTIALLY_HARMFUL_APPLICATION',
        ],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };

    const res = await fetchWithTimeout(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      console.warn(`[reputation] Google Safe Browsing error ${res.status}`);
      return { provider: 'google_safe_browsing', status: REPUTATION_STATUS.VERIFICATION_UNAVAILABLE };
    }

    const data = await res.json();

    if (data?.matches && data.matches.length > 0) {
      const threatType = data.matches[0]?.threatType || 'UNKNOWN_THREAT';
      return {
        provider: 'google_safe_browsing',
        status: REPUTATION_STATUS.VERIFIED_MALICIOUS,
        threatType,
        detail: `Google Safe Browsing identified this URL as: ${threatType.replace(/_/g, ' ').toLowerCase()}.`,
      };
    }

    // Empty response means no matches found — the URL is not on the blocklist
    return {
      provider: 'google_safe_browsing',
      status: REPUTATION_STATUS.VERIFIED_SAFE,
      detail: 'Google Safe Browsing found no threats associated with this URL.',
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[reputation] Google Safe Browsing timed out');
    } else {
      console.warn('[reputation] Google Safe Browsing error:', err.message);
    }
    return { provider: 'google_safe_browsing', status: REPUTATION_STATUS.VERIFICATION_UNAVAILABLE };
  }
}

// ---------------------------------------------------------------------------
// AbuseIPDB — only for IP-address URLs
// API docs: https://docs.abuseipdb.com/#check-endpoint
// ---------------------------------------------------------------------------

async function checkAbuseIpdb(ipAddress) {
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey) {
    return { provider: 'abuseipdb', status: REPUTATION_STATUS.NOT_CONFIGURED };
  }

  try {
    const params = new URLSearchParams({ ipAddress, maxAgeInDays: '90', verbose: '' });
    const res = await fetchWithTimeout(
      `https://api.abuseipdb.com/api/v2/check?${params.toString()}`,
      {
        headers: {
          Key: apiKey,
          Accept: 'application/json',
        },
      },
    );

    if (!res.ok) {
      console.warn(`[reputation] AbuseIPDB error ${res.status}`);
      return { provider: 'abuseipdb', status: REPUTATION_STATUS.VERIFICATION_UNAVAILABLE };
    }

    const data = await res.json();
    const score = Number(data?.data?.abuseConfidenceScore ?? -1);

    if (score < 0) {
      return { provider: 'abuseipdb', status: REPUTATION_STATUS.UNKNOWN };
    }
    if (score > 50) {
      return {
        provider: 'abuseipdb',
        status: REPUTATION_STATUS.VERIFIED_MALICIOUS,
        abuseConfidenceScore: score,
        detail: `AbuseIPDB confidence score: ${score}% — this IP address is associated with reported abuse.`,
      };
    }
    if (score > 20) {
      return {
        provider: 'abuseipdb',
        status: REPUTATION_STATUS.SUSPICIOUS,
        abuseConfidenceScore: score,
        detail: `AbuseIPDB confidence score: ${score}% — this IP address has some reported abuse history.`,
      };
    }

    return {
      provider: 'abuseipdb',
      status: REPUTATION_STATUS.UNKNOWN,
      abuseConfidenceScore: score,
      detail: `AbuseIPDB found no significant abuse reports for this IP address (score: ${score}%).`,
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[reputation] AbuseIPDB timed out');
    } else {
      console.warn('[reputation] AbuseIPDB error:', err.message);
    }
    return { provider: 'abuseipdb', status: REPUTATION_STATUS.VERIFICATION_UNAVAILABLE };
  }
}

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

/**
 * Check reputation of a URL against configured providers.
 * Returns a structured result with honest status for each provider.
 *
 * @param {string} url - The URL to check
 * @returns {Promise<ReputationResult>}
 */
export async function checkReputation(url) {
  const ip = extractIp(url);

  // Run all applicable checks in parallel
  const [vtResult, gsbResult, ipdbResult] = await Promise.all([
    checkVirusTotal(url),
    checkGoogleSafeBrowsing(url),
    ip ? checkAbuseIpdb(ip) : Promise.resolve({ provider: 'abuseipdb', status: REPUTATION_STATUS.NOT_CONFIGURED }),
  ]);

  const overallStatus = mostSevere(vtResult.status, gsbResult.status, ipdbResult.status);

  return {
    url,
    virusTotal: vtResult,
    safeBrowsing: gsbResult,
    abuseIpdb: ipdbResult,
    overallStatus,
    isIpAddress: Boolean(ip),
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Returns true if any reputation provider is configured.
 */
export function isReputationConfigured() {
  return Boolean(
    process.env.VIRUSTOTAL_API_KEY ||
    process.env.GOOGLE_SAFE_BROWSING_API_KEY ||
    process.env.ABUSEIPDB_API_KEY,
  );
}

/**
 * Returns a human-readable label for a reputation status.
 */
export function reputationStatusLabel(status) {
  const labels = {
    [REPUTATION_STATUS.NOT_CONFIGURED]: 'Not configured',
    [REPUTATION_STATUS.VERIFICATION_UNAVAILABLE]: 'Verification unavailable',
    [REPUTATION_STATUS.UNKNOWN]: 'Unknown',
    [REPUTATION_STATUS.SUSPICIOUS]: 'Suspicious',
    [REPUTATION_STATUS.VERIFIED_SAFE]: 'Verified safe',
    [REPUTATION_STATUS.VERIFIED_MALICIOUS]: 'Confirmed malicious',
  };
  return labels[status] ?? 'Unknown';
}
