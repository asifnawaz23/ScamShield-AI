// ScamShield AI — Rules-based Threat Intelligence Engine
// This engine produces explainable risk assessments in DEMO MODE,
// and, when live AI is configured, serves as the safety net/validator.
// Everything it produces is framed as likelihood, not verdict.

const CATEGORIES = [
  { id: 'phishing', label: 'Phishing', icon: 'phishing', tone: 'orange' },
  { id: 'fake_prize', label: 'Fake Prize', icon: 'gift', tone: 'red' },
  { id: 'job_scam', label: 'Job Scam', icon: 'briefcase', tone: 'orange' },
  { id: 'investment_scam', label: 'Investment Scam', icon: 'trending', tone: 'red' },
  { id: 'payment_scam', label: 'Payment Scam', icon: 'creditcard', tone: 'red' },
  { id: 'impersonation', label: 'Impersonation', icon: 'users', tone: 'orange' },
  { id: 'account_takeover', label: 'Account Takeover Attempt', icon: 'key', tone: 'red' },
  { id: 'delivery_scam', label: 'Delivery Scam', icon: 'package', tone: 'orange' },
  { id: 'romance', label: 'Romance / Social Engineering', icon: 'heart', tone: 'orange' },
  { id: 'tech_support', label: 'Tech Support Scam', icon: 'wrench', tone: 'orange' },
  { id: 'unknown', label: 'Unknown Suspicious Pattern', icon: 'shield', tone: 'yellow' },
];

const RISK_LEVELS = [
  { max: 19, level: 'safe', label: 'LIKELY SAFE', tone: 'green' },
  { max: 39, level: 'low', label: 'LOW RISK', tone: 'green' },
  { max: 59, level: 'suspicious', label: 'SUSPICIOUS', tone: 'yellow' },
  { max: 79, level: 'high', label: 'HIGH RISK', tone: 'orange' },
  { max: 100, level: 'critical', label: 'CRITICAL', tone: 'red' },
];

function findLevel(score) {
  return RISK_LEVELS.find((l) => score <= l.max);
}
function findCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

const RE = {
  urgency: [
    /urgent/i, /\bimmediately\b/i, /right now/i, /act now/i, /\basap\b/i,
    /within\s*\d+\s*hour/i, /expiring (today|soon)/i, /last chance/i,
    /don'?t miss/i, /limited time/i, /before (midnight|tomorrow)/i,
    /hurry/i, /respond quickly/i,
  ],
  fear: [
    /your (account|card|wallet) (will be|has been) (blocked|suspended|locked)/i,
    /account.*(blocked|suspended|will be closed)/i,
    /legal action/i, /\barrest\b/i, /complaint (filed|registered)/i,
    /penalty/i, /forensic/i, /pay (or|to avoid)/i, /your (aadhaar|pan|kyc) (will|has) (be|been) blocked/i,
  ],
  authority: [
    /bank|sbi|hdfc|icici|axis|yes bank/i,
    /government|income tax|gst|income.?tax department/i,
    /police|cyber cell|legal/i,
    /\bofficial\b/i, /authorized/i, /registered agent/i,
    /customer (care|support)/i, /support team/i,
    /reserve bank|rbi|sebi/i,
    /amazon|flipkart|netflix|microsoft|google|whatsapp|paytm|phonepe|icloud|apple|paypal|instagram|telegram|linkedin/i,
    /courier|dtdc|blue dart|india post|fedex|ups/i,
  ],
  reward: [
    /congratulations/i, /you (have )?been selected/i, /you ('ve| have) won/i,
    /prize/i, /reward/i, /claim (your|the)/i, /lucky (winner|draw)/i,
    /lottery/i, /gift (card|voucher|hamper)/i, /festival (offer|bonus|draw)/i,
    /win.?ner/i, /selected.*reward/i,
  ],
  tooGood: [
    /rs\.?\s?\d[\d,.]{2,}|inr\s?\d[\d,.]{2,}|(?:us\$|\$)\d{2,}/i,
    /double your money/i, /guaranteed (profit|return|earnings)/i,
    /earn (up to )?(rs\.|inr|\$)?\s?\d[\d,.]{2,}/i, /daily (earning|income)/i,
    /easy (money|earning|income)/i, /get rich/i, /invest.*guaranteed/i,
  ],
  credential: [
    /password/i, /login (credentials|details|id)/i, /update your (password|pin|credentials)/i,
    /verify your (account|identity|login)/i, /confirm (your )?(account|identity|details)/i,
    /enter your (login|user id|username)/i, /unlock (your )?account/i,
  ],
  otp: [
    /\botp\b/i, /one[- ]?time password/i, /share (the |your )?(code|otp)/i,
    /verification code/i, /confirm (the |your )?otp/i, /enter the code (sent|received)/i,
  ],
  payment: [
    /processing (fee|charge)/i, /registration (fee|amount)/i, /security (deposit|amount)/i,
    /advance (amount|payment)/i, /transfer the (amount|money)/i, /send (money|funds|payment)/i,
    /\bupi\b/i, /paytm|phonepe|google pay|gpay/i, /bank (details|transfer)/i,
    /card (number|cvv|details)/i, /account number/i, /ifsc/i, /pay first/i,
    /fee to (release|claim|unlock)/i, /money to.*receive/i,
  ],
  bypass: [
    /don'?t (tell|share) (anyone|this)/i, /keep (this|it) (confidential|secret|private)/i,
    /contact me (directly|on whatsapp|on telegram|on instagram)/i,
    /message (me|us) on (whatsapp|telegram|instagram|dms)/i,
    /call this number/i, /don'?t call (support|customer care)/i,
    /avoid (official|the) (channel|process|procedure)/i, /off.?the.?record/i,
  ],
  employment: [
    /work from home/i, /no (experience|skills needed)/i, /daily (salary|payout)/i,
    /joining (bonus|amount)/i, /interview on (whatsapp|zoom|telegram)/i,
    /earn per task/i, /copy.?paste jobs/i, /data entry.*(salary|earning)/i,
    /free (training|computer)/i, /e?commerce (task|seller)/i, /enroll (now|today)/i,
  ],
  investment: [
    /guaranteed returns/i, /double your (money|investment)/i,
    /crypto (investment|trading|signals)/i, /bitcoin|ethereum|usdt/i,
    /expert (trading|signals|tips)/i, /invest.*(daily|weekly) (return|profit)/i,
    /stock (tips|recommendation)/i,     /mutual fund.*guaranteed/i,
    /get rich/i, /early (access|investors)/i,
  ],
  romance: [
    /hello (dear|sweet|beautiful)/i, /i (love|admire) you/i,
    /buy me a gift/i, /send me.*(gift card|itunes|western union)/i,
    /marry/i, /travel to (see|meet) you/i, /need money.*(visa|ticket|hospital)/i,
  ],
  techSupport: [
    /your (device|computer|pc) (has|is) (a )?(virus|infected|compromised)/i,
    /windows support/i, /microsoft (support|technician)/i,
    /call.*(this number|us immediately)/i, /remote (access|support)/i,
    /your computer will be/i,
  ],
  delivery: [
    /package (awaiting|held|failed)/i, /delivery (failed|attempted|pending)/i,
    /reschedule (your )?delivery/i, /shipping (fee|charge)/i,
    /\bparcel\b/i, /tracking (id|number)/i, /customs (fee|duty|charge)/i,
    /confirm your (address|details) to (receive|get) (the )?(parcel|package)/i,
  ],
};

const WEIGHTS = {
  // code -> { base, dims: {dimKey: add} }
  urgency: { base: 22, dims: { urgency: 4 } },
  fear: { base: 20, dims: { socialEngineering: 3, urgency: 2 } },
  authority: { base: 12, dims: { socialEngineering: 3, impersonation: 3 } },
  reward: { base: 22, dims: { financial: 3, socialEngineering: 2 } },
  tooGood: { base: 26, dims: { financial: 5 } },
  credential: { base: 26, dims: { credential: 6, socialEngineering: 2 } },
  otp: { base: 30, dims: { credential: 7 } },
  payment: { base: 28, dims: { financial: 5, credential: 2 } },
  bypass: { base: 18, dims: { socialEngineering: 3 } },
  employment: { base: 22, dims: { financial: 3, socialEngineering: 2 } },
  investment: { base: 26, dims: { financial: 5 } },
  romance: { base: 20, dims: { socialEngineering: 4 } },
  techSupport: { base: 24, dims: { socialEngineering: 3, urgency: 2 } },
  delivery: { base: 18, dims: { financial: 2, socialEngineering: 2 } },
};

const SIGNAL_LABELS = {
  urgency: 'Urgent Language',
  fear: 'Fear / Threat Language',
  authority: 'Authority Impersonation',
  reward: 'Reward Bait',
  tooGood: 'Too-Good-To-Be-True Claim',
  credential: 'Credential Request',
  otp: 'OTP / Verification Code Request',
  payment: 'Payment / Financial Request',
  bypass: 'Pressure to Bypass Normal Procedures',
  employment: 'Fake Employment Offer Pattern',
  investment: 'Investment Promise',
  romance: 'Romance / False-Pretext Bait',
  techSupport: 'Tech-Support Pattern',
  delivery: 'Delivery / Parcel Pattern',
};

const SIGNAL_EXPLANATIONS = {
  urgency: 'The message creates pressure to act before the claim can be verified.',
  fear: 'Threatening or frightening language is used to push a hasty decision.',
  authority: 'The sender claims an official identity without proof of authenticity.',
  reward: 'An unusually attractive reward is offered with little credible context.',
  tooGood: 'The promised benefit is far above what legitimate offers typically provide.',
  credential: 'The flow nudges the user toward sharing login or account credentials.',
  otp: 'The message seeks a one-time password or verification code.',
  payment: 'The flow steers the user toward a payment, transfer, or financial detail.',
  bypass: 'The message asks the user to work around official channels and normal procedures.',
  employment: 'The offer uses patterns common to fraudulent job and task-based schemes.',
  investment: 'The returns promised are disproportionate to any legitimate instrument.',
  romance: 'The message appears designed to build trust and then request money or gifts.',
  techSupport: 'The message poses a technical problem to justify access or payment.',
  delivery: 'The message invokes a parcel to encourage payment or personal details.',
};

const DIMENSION_DEFS = [
  { key: 'socialEngineering', label: 'Social Engineering', color: '#f59e0b' },
  { key: 'linkRisk', label: 'Link Risk', color: '#f97316' },
  { key: 'urgency', label: 'Urgency', color: '#ef4444' },
  { key: 'credentialRisk', label: 'Credential Risk', color: '#a855f7' },
  { key: 'financialRisk', label: 'Financial Risk', color: '#ec4899' },
];

// ─── Trusted official domains (false-positive protection) ────────────────────
// These domains are known legitimate. A URL on these domains gets a "verified"
// indicator and its score is reduced. This is NOT a guarantee of safety
// (phishing via subdomains is still flagged), but prevents over-flagging
// emails like "Your Amazon order has shipped" that mention amazon.com.
const TRUSTED_DOMAINS = new Set([
  'amazon.com','amazon.in','amazon.co.uk','amazon.de','amazon.fr',
  'google.com','google.co.in','google.co.uk','accounts.google.com',
  'gmail.com','youtube.com','maps.google.com',
  'microsoft.com','outlook.com','live.com','office.com','microsoft365.com',
  'apple.com','icloud.com','support.apple.com',
  'paypal.com','paypal.me',
  'facebook.com','instagram.com','whatsapp.com','meta.com','messenger.com',
  'twitter.com','x.com','linkedin.com','github.com',
  'sbi.co.in','onlinesbi.sbi','sbicard.com',
  'hdfcbank.com','netbanking.hdfcbank.com',
  'icicibank.com','axisbank.com','kotak.com',
  'paytm.com','phonepe.com','gpay.app','upi.npci.org.in',
  'flipkart.com','myntra.com','snapdeal.com',
  'irctc.co.in','incometax.gov.in','uidai.gov.in','mca.gov.in',
  'netflix.com','spotify.com','hotstar.com','primevideo.com',
  'fedex.com','dhl.com','ups.com','usps.com','indiapost.gov.in',
  'zoom.us','meet.google.com','teams.microsoft.com',
]);

// Scam-specific domain patterns (beyond TLD checks)
const SCAM_DOMAIN_PATTERNS = [
  /sbi[^.]*\.(xyz|top|online|site|club|info|tk|ml|ga|cf|gq)/i,
  /hdfc[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /paytm[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /amazon[^.]*\.(xyz|top|online|site|club|info|tk|ml|cam)/i,
  /paypal[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /google[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /microsoft[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /apple[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /govt?[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /bank[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /income.?tax[^.]*\.(xyz|top|online|site|club)/i,
  /(verify|secure|update|login|account|kyc)[^.]{0,20}\.(xyz|top|online|site|club|info|tk|ml)/i,
];

function isTrustedDomain(host) {
  const clean = host.replace(/^www\./, '').toLowerCase();
  if (TRUSTED_DOMAINS.has(clean)) return true;
  // Check if it's a direct subdomain of a trusted domain
  for (const td of TRUSTED_DOMAINS) {
    if (clean.endsWith('.' + td)) return true;
  }
  return false;
}

function isScamDomainPattern(host) {
  for (const rx of SCAM_DOMAIN_PATTERNS) {
    if (rx.test(host)) return true;
  }
  return false;
}

// ─── Phone number scam detection ─────────────────────────────────────────────
// Scammers often embed unofficial contact numbers
function analyzePhoneNumbers(text) {
  const signals = [];
  // WhatsApp / Telegram contact redirect (classic social engineering bypass)
  if (/message\s+(me|us)\s+(on|via|at)?\s*(whatsapp|telegram|signal)/i.test(text) ||
      /contact\s+(me|us)\s+(on|via|at)?\s*(whatsapp|telegram)/i.test(text) ||
      /whatsapp\s+(me|us|at|number|no)/i.test(text)) {
    signals.push({ label: 'WhatsApp Contact Redirect', severity: 'high', detail: 'Asking to move conversation to WhatsApp/Telegram avoids official channels and accountability.' });
  }
  // Informal number formats with context suggesting action (call us NOW, reach on +91...)
  const phoneInContext = /(\+91|0091|91)[-.\s]?\d{5}[-.\s]?\d{5}/.test(text) &&
    /(call|contact|reach|message|ping|add)/i.test(text);
  if (phoneInContext) {
    signals.push({ label: 'Unverified Phone Contact Request', severity: 'medium', detail: 'An unverified phone number is promoted as the contact point, bypassing official support channels.' });
  }
  return signals;
}

function findMatches(regexes, text) {
  const out = [];
  for (const rx of regexes) {
    const m = text.match(rx);
    if (m) out.push(m[0].trim());
  }
  return [...new Set(out)].slice(0, 5);
}

function grammarAnomalies(text) {
  const anomalies = [];
  const upper = (text.match(/[A-Z]/g) || []).length;
  const total = (text.match(/[A-Za-z]/g) || []).length;
  const ratio = total > 0 ? upper / total : 0;
  if (ratio > 0.45) anomalies.push('Excessive CAPITALISATION suggests shouting and pressure.');
  if ((text.match(/!{2,}/g) || []).length) anomalies.push('Repeated exclamation marks indicate artificial excitement.');
  if ((text.match(/\b(plz|u|ur|nd|pls|bcz|dnt|rply)\b/gi) || []).length) anomalies.push('Textspeak abbreviations that are unusual for official senders.');
  if ((text.match(/\d{10,}/g) || []).length) anomalies.push('Long numeric sequences may hide a masked phone number or ID.');
  // Inconsistent spacing around currency (scam formatting tells)
  if ((text.match(/Rs\.?\s{2,}\d|₹\s{2,}\d/g) || []).length) anomalies.push('Inconsistent spacing around currency amounts — common in automated scam messages.');
  return anomalies;
}

// ---- URL indicators ----
const URL_SHORTENERS = /(bit\.ly|tinyurl|cutt\.ly|rebrand\.ly|shorturl|is\.gd|rb\.gy|t\.me\/s|ow\.ly|goo\.gl)/i;
const URL_SUSPICIOUS_TLDS = /\.(xyz|top|club|online|icu|site|live|click|link|rest|work|buzz|gq|tk|ml|ga|cam|cf|pw|country|kim|party|trade|date|faith|racing|win|loan|bid)\b/i;
const URL_IP_DOMAIN = /https?:\/\/\d{1,3}(\.\d{1,3}){3}/;
const URL_IN_MESSAGE = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const URL_PUNYCODE = /xn--/i; // IDN homograph attack

export function analyzeUrl(url, context = '') {
  const indicators = [];
  let score = 0;
  let clean = url.trim().replace(/[.,;'"!)\]>]+$/, '');
  const add = (label, status, detail) => indicators.push({ label, status, detail });

  if (!/^https?:\/\//i.test(clean)) {
    add('Protocol', 'danger', 'No valid http(s) protocol detected — link should not be trusted.');
    score += 35;
    return { url: clean, indicators, riskScore: score };
  }

  const isHttps = /^https:\/\//i.test(clean);
  let parsedUrl;
  try { parsedUrl = new URL(clean); } catch { parsedUrl = null; }

  const host = (parsedUrl ? parsedUrl.hostname : clean.replace(/^https?:\/\//i, '').split(/[/?#]/)[0]).toLowerCase();
  const rootDomain = host.replace(/^www\./, '');

  // ── Trusted domain check (false-positive protection) ──────────────────────
  if (isTrustedDomain(host)) {
    add('Verified Official Domain', 'safe', `"${rootDomain}" is a known official domain. However, verify it is spelled correctly and check for suspicious subdomains or paths.`);
    // Even trusted domains get flagged if path has very suspicious patterns
    if (!isHttps) {
      add('Transport Security', 'warning', 'Even official-looking domains should use HTTPS.');
      score += 8;
    }
    // Only add a minimal safe score  
    if (score === 0) score = 2;
    return { url: clean, indicators, riskScore: score, isTrusted: true };
  }

  // ── Known scam domain patterns ────────────────────────────────────────────
  if (isScamDomainPattern(host)) {
    add('Known Scam Domain Pattern', 'danger', `"${host}" matches a pattern consistently seen in scam infrastructure — brand name combined with a free/cheap TLD.`);
    score += 45;
  }

  // ── Punycode / IDN homograph attack ──────────────────────────────────────
  if (URL_PUNYCODE.test(host)) {
    add('Punycode / IDN Domain', 'danger', 'Punycode encoding (xn--) is used to create lookalike domains that are visually identical to legitimate brands.');
    score += 35;
  }

  // ── Plain HTTP ────────────────────────────────────────────────────────────
  if (!isHttps) {
    add('Transport Security', 'warning', 'Uses plain http — data sent over this link is not encrypted.');
    score += 12;
  }

  // ── IP address hosting ────────────────────────────────────────────────────
  if (URL_IP_DOMAIN.test(clean)) {
    add('IP Address Hosting', 'danger', 'Domain is a raw IP address — legitimate services use domain names, not bare IPs. This is common in phishing infrastructure.');
    score += 35;
  }

  // ── URL shortener ─────────────────────────────────────────────────────────
  if (URL_SHORTENERS.test(clean)) {
    add('URL Shortener', 'warning', 'Shortened links hide the real destination until opened. Never click a shortened link from an unsolicited message.');
    score += 18;
  }

  // ── Suspicious TLD ────────────────────────────────────────────────────────
  if (URL_SUSPICIOUS_TLDS.test(host)) {
    const tld = host.split('.').pop();
    add('High-Risk Domain Extension', 'warning', `The .${tld} extension is very commonly used in low-cost phishing and scam domains. Legitimate services rarely use it.`);
    score += 20;
  }

  // ── Numerically dense domain ──────────────────────────────────────────────
  const digits = (host.match(/\d/g) || []).length;
  if (digits >= 4) {
    add('Numerically Dense Domain', 'warning', 'Heavy numeric content in a domain name is uncommon for legitimate brands and is a known evasion technique.');
    score += 10;
  }

  // ── Excessive subdomains ──────────────────────────────────────────────────
  const subparts = host.split('.');
  if (subparts.length > 3) {
    add('Excessive Subdomains', 'warning', `"${host}" has ${subparts.length - 2} subdomains. Attackers use subdomains to hide the real registrable domain at the end.`);
    score += 14;
  }

  // ── Action-oriented path keywords ────────────────────────────────────────
  if (parsedUrl) {
    const pathAndQuery = parsedUrl.pathname + (parsedUrl.search || '');
    if (/(\/login|\/verify|\/secure|\/account|\/update|\/bank|\/confirm|\/claim|\/reward|\/unlock|\/kyc|\/otp)/i.test(pathAndQuery)) {
      add('Action-Oriented Path', 'warning', 'The URL path contains words designed to trigger a login, verification, or submission action — a hallmark of credential-harvesting pages.');
      score += 12;
    }
    // Long query strings with tokens (phishing kits pass tokens)
    if (parsedUrl.search && parsedUrl.search.length > 100) {
      add('Long Encoded Query String', 'warning', 'Very long query parameters often contain encoded tracking tokens used by phishing kits to pre-fill fake login forms.');
      score += 8;
    }
  }

  // ── Brand-style domain tokens ─────────────────────────────────────────────
  if (/(login|signin|sign-in|secure|account|verify|update|bank|wallet|support|confirm|claim|reward|prize|kyc|otp)/i.test(rootDomain)) {
    add('Brand-style Domain Token', 'danger', 'The domain itself contains words typically used to impersonate a trusted service (e.g. "secure", "account", "verify"). This is a classic phishing pattern.');
    score += 22;
  }

  // ── Brand mismatch (context-aware) ────────────────────────────────────────
  if (context) {
    const brandPatterns = [
      { rx: /\bsbi\b/i, domain: 'sbi.co.in' },
      { rx: /\bhdfc\b/i, domain: 'hdfcbank.com' },
      { rx: /\bicici\b/i, domain: 'icicibank.com' },
      { rx: /\baxis\b/i, domain: 'axisbank.com' },
      { rx: /\bamazon\b/i, domain: 'amazon' },
      { rx: /\bpaypal\b/i, domain: 'paypal.com' },
      { rx: /\bpaytm\b/i, domain: 'paytm.com' },
      { rx: /\bphonepe\b/i, domain: 'phonepe.com' },
      { rx: /\bgoogle\b/i, domain: 'google.com' },
      { rx: /\bmicrosoft\b/i, domain: 'microsoft.com' },
      { rx: /\bapple\b/i, domain: 'apple.com' },
      { rx: /\bnetflix\b/i, domain: 'netflix.com' },
      { rx: /\bflipcart|flipkart\b/i, domain: 'flipkart.com' },
    ];
    for (const { rx, domain } of brandPatterns) {
      if (rx.test(context) && !host.includes(domain.replace('.com','').replace('.co.in','').replace('.sbi',''))) {
        add('Brand / Domain Mismatch', 'danger', `Message references a known brand but the URL domain "${rootDomain}" does not match that brand's official address. This is the #1 sign of a phishing link.`);
        score += 30;
        break;
      }
    }
  }

  if (score === 0) {
    add('Basic Structure', 'safe', 'No immediate structural red flags detected in this link. Still verify the destination before clicking.');
  }

  return { url: clean, indicators, riskScore: Math.min(score, 120), isTrusted: false };
}

// ---- Main analysis ----
export function analyzeContent(content, type = 'text') {
  const text = String(content || '').trim();
  const detected = [];
  const evidenceBySignal = {};

  for (const [code, regexes] of Object.entries(RE)) {
    const matches = findMatches(regexes, text);
    if (matches.length) {
      evidenceBySignal[code] = matches;
      detected.push(code);
    }
  }

  // grammar anomalies
  const grammar = grammarAnomalies(text);
  const grammarSignal = grammar.length
    ? { code: 'grammar', label: 'Grammar Anomalies', severity: 'low', evidence: grammar, explanation: 'Stylistic and structural oddities that legitimate brands rarely produce.', base: 6, dims: { socialEngineering: 1 } }
    : null;

  // phone number / redirect signals
  const phoneSignals = analyzePhoneNumbers(text);

  // URL inside text
  const urlMatches = text.match(URL_IN_MESSAGE) || [];
  const urlIndicators = [];
  const urlScores = [];
  let linkRisk = 0;
  let anyTrustedUrl = false;
  for (const u of urlMatches) {
    const r = analyzeUrl(u, text);
    urlScores.push(r.riskScore);
    if (r.isTrusted) {
      anyTrustedUrl = true;
    } else if (r.riskScore > 30) {
      linkRisk += r.riskScore - 20;
    }
    urlIndicators.push(...r.indicators.map((i) => ({ ...i, url: r.url })));
  }
  if (urlMatches.length) {
    detected.push('suspiciousLink');
    evidenceBySignal.suspiciousLink = urlMatches.slice(0, 3);
  }

  // Build weighted signals
  const dims = { socialEngineering: 0, linkRisk: 0, urgency: 0, credentialRisk: 0, financialRisk: 0 };
  let raw = 0;
  const touched = new Set();

  for (const code of detected) {
    const w = WEIGHTS[code];
    if (!w) continue;
    const count = Math.min(evidenceBySignal[code].length, 3);
    const mult = 1 + (count - 1) * 0.15;
    raw += w.base * mult;
    touched.add(code);
    for (const [dk, dv] of Object.entries(w.dims)) dims[dk] = Math.min(100, dims[dk] + dv);
  }
  if (grammarSignal) {
    raw += grammarSignal.base;
    touched.add('grammar');
    dims.socialEngineering = Math.min(100, dims.socialEngineering + grammarSignal.dims.socialEngineering);
  }
  // Phone redirect signals add to raw score
  for (const ps of phoneSignals) {
    raw += ps.severity === 'high' ? 18 : 10;
    touched.add('phoneRedirect');
    dims.socialEngineering = Math.min(100, dims.socialEngineering + 3);
  }

  dims.linkRisk = Math.min(100, linkRisk + (urlMatches.length && !anyTrustedUrl ? 20 : 0));
  for (const k of Object.keys(dims)) dims[k] = Math.min(100, Math.round(Math.max(dims[k], raw / 12)));

  const seq = [...detected].filter((d) => d !== 'suspiciousLink');
  if (urlMatches.length) seq.push('suspiciousLink');
  if (grammarSignal) seq.push('grammar');

  // Category selection
  let categoryId = 'unknown';
  const P = (s) => detected.includes(s);
  if (P('otp')) categoryId = 'account_takeover';
  else if (P('techSupport')) categoryId = 'tech_support';
  else if (P('authority') && (P('credential') || P('otp') || P('payment'))) categoryId = 'impersonation';
  else if (P('investment')) categoryId = 'investment_scam';
  else if (P('employment')) categoryId = 'job_scam';
  else if (P('delivery')) categoryId = 'delivery_scam';
  else if (P('romance')) categoryId = 'romance';
  else if (P('credential') && P('suspiciousLink')) categoryId = 'phishing';
  else if (P('reward') || P('tooGood')) categoryId = 'fake_prize';
  else if (P('payment')) categoryId = 'payment_scam';
  else if (P('authority')) categoryId = 'impersonation';

  // Risk score calculation
  const grammarPct = Math.min(20, grammar.length * 6);
  let rawScore = raw * 0.66;
  let comboBonus = 0;
  const combo = (a, b, v) => { if (P(a) && P(b)) comboBonus += v; };
  combo('reward', 'tooGood', 20);
  combo('urgency', 'suspiciousLink', 8);
  combo('urgency', 'reward', 6);
  combo('fear', 'urgency', 8);
  combo('credential', 'suspiciousLink', 10);
  combo('otp', 'fear', 10);
  combo('payment', 'fear', 8);
  combo('employment', 'payment', 8);
  combo('investment', 'tooGood', 10);
  // Phone redirect with payment/credential is very high risk
  if (phoneSignals.length && (P('payment') || P('credential') || P('otp'))) comboBonus += 12;

  const urlBonus = Math.min(15, urlMatches.length * 6);
  let riskScore = Math.min(98, Math.round(rawScore + comboBonus + grammarPct + urlBonus));

  const maxUrlRisk = urlScores.length ? Math.max(...urlScores) : 0;
  if (type === 'url' && maxUrlRisk > 0) {
    riskScore = Math.min(98, Math.max(riskScore, Math.round(riskScore * 0.35 + maxUrlRisk * 0.65)));
    if (maxUrlRisk >= 40 && categoryId === 'unknown') categoryId = 'phishing';
    const textSignals = detected.filter((d) => d !== 'suspiciousLink' && d !== 'grammar');
    if (maxUrlRisk < 40 && categoryId === 'impersonation' && textSignals.length <= 1) categoryId = 'unknown';
  }

  // Trusted URL reduces risk (only if NO other high signals present)
  if (anyTrustedUrl && !P('otp') && !P('credential') && !P('payment') && !P('fear') && raw < 30) {
    riskScore = Math.max(6, Math.round(riskScore * 0.5));
  }

  if (text.length < 20 && riskScore > 30) {
    riskScore = Math.max(10, Math.round(riskScore * 0.7));
  }
  if (!seq.length) riskScore = Math.max(6, riskScore);

  const level = findLevel(riskScore);
  const category = findCategory(categoryId);

  // Confidence
  const strong = ['otp', 'credential', 'payment', 'tooGood', 'reward', 'fear'].filter((s) => touched.has(s)).length;
  let confidence = Math.min(96, 44 + touched.size * 6 + strong * 5 + (urlMatches.length ? 4 : 0) + phoneSignals.length * 3);
  if (text.length < 15 && !urlMatches.length) confidence = Math.min(confidence, 45);
  const confidenceLabel = confidence >= 80 ? 'HIGH' : confidence >= 55 ? 'MODERATE' : 'LOW';

  // Requested information
  const requestedInformation = [];
  if (detected.includes('otp')) requestedInformation.push({ kind: 'OTP / verification code', sensitivity: 'CRITICAL' });
  if (detected.includes('credential')) requestedInformation.push({ kind: 'Login / account credentials', sensitivity: 'CRITICAL' });
  if (detected.includes('payment')) requestedInformation.push({ kind: 'Payment, transfer, or financial details', sensitivity: 'CRITICAL' });
  if (/date of birth|dob|aadhaar|pan card|passport/i.test(text)) requestedInformation.push({ kind: 'Government ID / personal identity document', sensitivity: 'CRITICAL' });
  if (/address|phone number|mobile number/i.test(text) && riskScore > 30) requestedInformation.push({ kind: 'Personal contact / address details', sensitivity: 'HIGH' });
  if (/cvv|card number|expiry|debit card|credit card/i.test(text)) requestedInformation.push({ kind: 'Card / banking details', sensitivity: 'CRITICAL' });

  // Manipulation tactics
  const tactics = [];
  const mkTactic = (name, on, blurb) => { if (on) tactics.push({ name, detected: true, blurb }); };
  mkTactic('Urgency', detected.includes('urgency') || detected.includes('fear'), 'Compressing the time available to think and verify before acting.');
  mkTactic('Authority impersonation', detected.includes('authority'), "Borrowing a trusted brand or institution's identity to lower suspicion.");
  mkTactic('Fear / intimidation', detected.includes('fear'), 'Threatening consequences (account blocked, legal action) to override caution.');
  mkTactic('Reward bait', detected.includes('reward') || detected.includes('tooGood'), 'Dangling an attractive reward to distract from unusual requests.');
  mkTactic('Scarcity / time pressure', /limited|last chance|only today|few (seats|slots)|expires/i.test(text), 'Claiming limited availability or expiry to force a snap decision.');
  mkTactic('Secrecy / channel jump', detected.includes('bypass'), 'Asking to keep it secret or move to WhatsApp/Telegram to avoid oversight.');
  mkTactic('Advance fee', detected.includes('payment') && (detected.includes('reward') || detected.includes('delivery')), 'Asking for a small "fee" to unlock a prize, parcel, or benefit that never materialises.');
  mkTactic('Credential harvesting', detected.includes('credential') || detected.includes('otp'), 'Creating a pathway to steal login credentials or one-time codes.');

  // Reasons (explainability)
  const reasons = [];
  let n = 1;
  const reasonOrder = ['otp','credential','payment','fear','urgency','reward','tooGood','authority','bypass','employment','investment','romance','techSupport','delivery','suspiciousLink','grammar'];
  for (const code of reasonOrder) {
    if (!seq.includes(code)) continue;
    const ev = (evidenceBySignal[code] || []).join(' · ');
    const baseW = code === 'suspiciousLink' ? 24 : (WEIGHTS[code] ? WEIGHTS[code].base : 6);
    const contribution = baseW >= 26 ? 'HIGH' : baseW >= 18 ? 'MEDIUM' : 'LOW';
    const label = code === 'suspiciousLink' ? 'Suspicious Link' : SIGNAL_LABELS[code];
    const explanation = code === 'suspiciousLink'
      ? 'The destination carries structural risk indicators. Verify the domain against the official website before opening.'
      : SIGNAL_EXPLANATIONS[code] || 'This pattern contributes to the overall risk assessment.';
    reasons.push({ n, title: label, tone: contribution === 'HIGH' ? 'red' : contribution === 'MEDIUM' ? 'orange' : 'yellow', contribution, explanation, evidence: ev });
    n++;
  }
  // Add phone redirect reasons
  for (const ps of phoneSignals) {
    reasons.push({ n, title: ps.label, tone: ps.severity === 'high' ? 'orange' : 'yellow', contribution: ps.severity === 'high' ? 'MEDIUM' : 'LOW', explanation: ps.detail, evidence: '' });
    n++;
  }
  if (type === 'url' && maxUrlRisk > 0) {
    const inds = urlIndicators.filter(i => i.status !== 'safe').map((i) => i.label).slice(0, 4).join(' · ');
    if (inds) {
      reasons.push({
        n, title: 'URL Structure Risk',
        tone: maxUrlRisk >= 40 ? 'red' : 'yellow',
        contribution: maxUrlRisk >= 40 ? 'HIGH' : 'MEDIUM',
        explanation: 'The link carries structural indicators common in phishing infrastructure. It should never be opened before independent verification.',
        evidence: inds,
      });
      n++;
    }
  }

  // Attack chain by category
  function chainFor(catId) {
    const chains = {
      account_takeover: [
        { label: 'Fake authority message arrives', description: 'An urgent message claims account action is required, often impersonating the service.' },
        { label: 'User clicks link or calls number', description: 'Fear or urgency causes the user to engage without verifying.' },
        { label: 'OTP / credentials are requested', description: 'The attacker collects the verification code or login details.' },
        { label: 'Account is taken over', description: 'With the OTP, the attacker changes login details and locks the real owner out.' },
        { label: 'Financial fraud / identity theft follows', description: 'Funds are moved, personal data is extracted, or the account is sold.' },
      ],
      phishing: [
        { label: 'Phishing link is sent', description: 'The message contains a link pointing to a lookalike login page.' },
        { label: 'User visits the fake page', description: 'The page looks identical to the real service.' },
        { label: 'Credentials entered on fake page', description: 'Username and password are captured by the attacker.' },
        { label: 'Real account is accessed', description: 'Attacker logs in to the real service using stolen credentials.' },
        { label: 'Funds / data extracted', description: 'Money is transferred or data is sold.' },
      ],
      fake_prize: [
        { label: '"You\'ve won!" message received', description: 'An exciting prize notification creates euphoria and lowers rational thinking.' },
        { label: 'User pays "processing fee"', description: 'A small upfront payment is required to release the prize.' },
        { label: 'Additional charges appear', description: 'More fees, taxes, or charges are invented to extract more money.' },
        { label: 'Prize never arrives', description: 'Communication stops after payments are made.' },
        { label: 'Financial loss + data exposed', description: 'The user has lost money and may have shared bank details.' },
      ],
      delivery_scam: [
        { label: 'Fake parcel notification received', description: 'The message claims a package is held, requiring a small customs fee.' },
        { label: 'User pays delivery fee', description: 'A small fee is paid via the provided link.' },
        { label: 'Card / banking details captured', description: 'The payment page harvests full card details.' },
        { label: 'Further charges initiated', description: 'The attacker uses captured card details for larger transactions.' },
      ],
      investment_scam: [
        { label: '"Guaranteed returns" pitch received', description: 'An unrealistically high return is promised to entice investment.' },
        { label: 'Initial small investment made', description: 'A small "proof of concept" deposit generates a fake profit shown on a dashboard.' },
        { label: 'Larger investment requested', description: 'Encouraged by fake gains, the victim invests more.' },
        { label: 'Withdrawal blocked / exit scam', description: 'When withdrawal is requested, new fees appear or the platform disappears.' },
      ],
      job_scam: [
        { label: '"No experience" job offer received', description: 'An attractive work-from-home offer targets people seeking income.' },
        { label: 'Registration / training fee requested', description: 'A fee is required "to secure the slot" before starting.' },
        { label: 'Tasks given but payment withheld', description: 'Work may be performed but payment is always just out of reach.' },
        { label: 'Job disappears, money lost', description: 'The platform vanishes after extracting fees.' },
      ],
    };
    return chains[catId] || [
      { label: 'Suspicious message received', description: 'A message arrives through a trusted channel.' },
      { label: 'User engages with the bait', description: 'Curiosity, reward, fear or urgency prompts engagement.' },
      { label: 'User is directed to a deceptive resource', description: 'A fake page, fake contact, or fake app continues the deception.' },
      { label: 'Sensitive information or money is provided', description: 'Credentials, an OTP, a payment, or personal details are shared.' },
      { label: 'Account or funds compromised', description: 'The attacker uses what was shared.' },
    ];
  }

  // Recommended actions
  const recommendedActions = [];
  if (riskScore >= 40) {
    recommendedActions.push("Do NOT click any links or call any numbers provided in this message.");
    recommendedActions.push("Do NOT share passwords, OTPs, PINs, CVVs, or any card details.");
  }
  recommendedActions.push("Verify independently: contact the organisation through its official website or official app.");
  if (P('otp')) recommendedActions.push("A genuine bank, service, or government agency will NEVER ask you to share an OTP.");
  if (P('payment') || P('tooGood') || P('reward')) recommendedActions.push("Any request for upfront payment to receive a prize or job offer is a scam.");
  if (P('employment')) recommendedActions.push("Legitimate employers never charge registration or training fees before employment.");
  if (categoryId === 'delivery_scam') recommendedActions.push("Track your parcel on the courier's official website — not through the link provided.");
  if (riskScore >= 60) recommendedActions.push("Report this message to your telecom provider (forward to 1909 in India) or local cybercrime portal.");
  if (P('credential') || P('otp')) recommendedActions.push("If you already shared credentials, change your passwords immediately and enable 2FA.");
  if (P('payment') && riskScore >= 60) recommendedActions.push("If payment was already made, contact your bank immediately to dispute the transaction.");
  recommendedActions.push("Block and report the sender on the platform where you received this message.");

  // Safe reply
  const safeReply = "Thank you for your message. I do not share personal details, OTPs, passwords, or financial information through unsolicited messages. I will verify this request by contacting your organisation through its official website or published phone number before taking any action.";

  // Evidence / inference / uncertainty
  const evidenceList = [];
  for (const code of seq) {
    for (const e of (evidenceBySignal[code] || []).slice(0, 3)) {
      evidenceList.push(`"${e}" — matched ${code === 'suspiciousLink' ? 'suspicious URL' : SIGNAL_LABELS[code] || code} pattern`);
    }
  }
  for (const g of grammar) evidenceList.push(`Stylistic: ${g}`);
  for (const ps of phoneSignals) evidenceList.push(`Contact: ${ps.label}`);
  if (!evidenceList.length) evidenceList.push('No high-confidence scam marker phrases were matched in the supplied content.');

  const inferenceList = [];
  if (P('reward') || P('tooGood')) inferenceList.push('The reward/prize framing is consistent with a bait-and-fee scam pattern.');
  if (P('otp') || P('credential')) inferenceList.push('Requesting authentication codes is a strong indicator of an account-takeover attempt.');
  if (P('urgency') || P('fear')) inferenceList.push('Artificially created urgency is a core social-engineering technique to bypass rational decision-making.');
  if (urlIndicators.some((u) => u.status === 'danger')) inferenceList.push('The referenced URL shows structural characteristics common in phishing infrastructure.');
  if (P('authority') && !anyTrustedUrl) inferenceList.push("Claiming a well-known brand without using that brand's official domain is a strong impersonation indicator.");
  if (phoneSignals.length) inferenceList.push('Directing victims to WhatsApp/Telegram avoids official oversight and is a known scam tactic.');
  if (!inferenceList.length) inferenceList.push('Limited strong markers present — remaining risk is driven by ambiguous signals.');

  const uncertaintyList = [
    "Pattern-based assessment only — the sender's actual intent cannot be established from message content alone.",
    'Absence of detected signals is NOT proof a message is genuine. Always verify through official channels.',
    `Confidence is ${confidenceLabel} — ${confidence < 55 ? 'fewer signals detected, assessment is less reliable' : 'multiple signals detected, assessment is more reliable'}.`,
  ];

  // Summary
  let summary;
  if (riskScore >= 60) {
    const sigCount = touched.size;
    summary = `${sigCount} distinct suspicious signal class${sigCount !== 1 ? 'es' : ''} detected, consistent with ${category.label.toLowerCase()}. The combination of ${reasons.slice(0,2).map(r=>r.title.toLowerCase()).join(' + ')} is a high-risk pattern. Do not act on this message before verifying through official channels.`;
  } else if (riskScore >= 40) {
    summary = `Some suspicious characteristics were detected (${touched.size} signal class${touched.size !== 1 ? 'es' : ''}). This message is not clearly safe. Verify through official channels before trusting or replying.`;
  } else {
    summary = `No strong fraudulent patterns were detected. Remain cautious: absence of detected signals is not proof a message is genuine. Always verify unexpected requests through official channels.`;
  }

  const outcomeText =
    riskScore >= 80 ? 'CRITICAL — DO NOT ACT ON THIS MESSAGE'
    : riskScore >= 60 ? 'HIGH RISK — STRONG SCAM INDICATORS DETECTED'
    : riskScore >= 40 ? 'SUSPICIOUS — VERIFY BEFORE ACTING'
    : riskScore >= 20 ? 'LOW RISK — SOME CAUTION ADVISED'
    : 'LIKELY SAFE — NO STRONG THREAT PATTERNS DETECTED';

  const disclaimers = [
    'This is a pattern-based assessment — not a legal verdict and not a guarantee.',
    'AI and heuristic systems can produce false positives and false negatives.',
    'Always verify through the official website, app, or published phone number of the organisation.',
  ];

  return {
    riskScore,
    riskLevel: level.level,
    riskLabel: level.label,
    riskTone: level.tone,
    category: { id: category.id, label: category.label, icon: category.icon, tone: category.tone },
    outcomeText,
    summary,
    dimensions: DIMENSION_DEFS.map((d) => ({ ...d, score: dims[d.key === 'credentialRisk' ? 'credentialRisk' : d.key === 'financialRisk' ? 'financialRisk' : d.key] })),
    reasons,
    manipulationTactics: tactics,
    requestedInformation,
    urlIndicators,
    recommendedActions,
    safeReply,
    attackChain: chainFor(categoryId),
    confidence,
    confidenceLabel,
    evidenceBasis: { evidence: evidenceList, inference: inferenceList, uncertainty: uncertaintyList },
    disclaimers,
    // Extra metadata
    detectedSignalCount: touched.size,
    phoneSignals,
    hasUrl: urlMatches.length > 0,
    hasTrustedUrl: anyTrustedUrl,
  };
}

export { CATEGORIES, RISK_LEVELS };