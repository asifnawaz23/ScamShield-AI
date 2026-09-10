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
  return anomalies;
}

// ---- URL indicators ----
const URL_SHORTENERS = /(bit\.ly|tinyurl|cutt\.ly|rebrand\.ly|shorturl|is\.gd|rb\.gy|t\.me\/s)/i;
const URL_SUSPICIOUS_TLDS = /\.(xyz|top|club|online|icu|site|live|click|link|rest|work|buzz|gq|tk|ml|ga|cam)\b/i;
const URL_IP_DOMAIN = /https?:\/\/\d{1,3}(\.\d{1,3}){3}/;
const URL_IN_MESSAGE = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

export function analyzeUrl(url, context = '') {
  const indicators = [];
  let score = 0;
  let clean = url.trim().replace(/[.,;]+$/, '');
  const add = (label, status, detail) => indicators.push({ label, status, detail });
  if (!/^https?:\/\//i.test(clean)) {
    add('Protocol', 'danger', 'No valid http(s) protocol detected — link should not be trusted.');
    score += 35;
    return { url: clean, indicators, riskScore: score };
  }
  const isHttps = /^https:\/\//i.test(clean);
  if (!isHttps) {
    add('Transport Security', 'warning', 'Uses plain http — data sent over this link is not encrypted.');
    score += 12;
  }
  const host = clean.replace(/^https?:\/\/i?/i, '').split(/[/?#]/)[0].toLowerCase();
  if (URL_IP_DOMAIN.test(clean)) {
    add('IP Address Hosting', 'danger', 'Domain is a raw IP address, common in phishing infrastructure.');
    score += 30;
  }
  if (URL_SHORTENERS.test(clean)) {
    add('URL Shortener', 'warning', 'Shortened links hide the real destination until opened.');
    score += 16;
  }
  if (URL_SUSPICIOUS_TLDS.test(host)) {
    add('High-Risk Domain Extension', 'warning', 'The .' + host.split('.').pop() + ' extension is commonly used in low-cost phishing domains.');
    score += 18;
  }
  const digits = (host.match(/\d/g) || []).length;
  if (digits >= 4) {
    add('Numerically Dense Domain', 'warning', 'Heavy numeric content in the domain is uncommon for legitimate brands.');
    score += 10;
  }
  const subparts = host.split('.');
  if (subparts.length > 3) {
    add('Excessive Subdomains', 'warning', 'Many subdomains can be used to disguise a real brand name.');
    score += 12;
  }
  const name = host.replace(/^www\./, '').split('.')[0];
  if (/(login|verify|secure|account|update|bank|confirm|claim)/i.test(clean)) {
    add('Action-Oriented Path', 'warning', 'The path uses words designed to trigger a login or submission action.');
    score += 10;
  }
  if (/(login|signin|sign-in|secure|account|verify|update|bank|wallet|support|help|confirm|claim|reward|prize|coupon)/i.test(host)) {
    add('Brand-style Domain Token', 'danger', 'The domain itself embeds words commonly used to imitate a trusted service, which is a classic phishing pattern.');
    score += 20;
  }
  const brandMatch = context && context.match(RE.authority);
  if (brandMatch && !new RegExp(brandMatch[0], 'i').test(host)) {
    add('Domain / Brand Mismatch', 'danger', `Claims to relate to "${brandMatch[0]}" but the domain does not match that brand's official address.`);
    score += 28;
  }
  if (score === 0) {
    add('Basic Structure', 'safe', 'No immediate structural red flags detected in this link.');
  }
  return { url: clean, indicators, riskScore: score };
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

  // grammar
  const grammar = grammarAnomalies(text);
  const grammarSignal = grammar.length
    ? { code: 'grammar', label: 'Grammar Anomalies', severity: 'low', evidence: grammar, explanation: 'Stylistic and structural oddities that legitimate brands rarely produce.', base: 6, dims: { socialEngineering: 1 } }
    : null;

  // URL inside text
  const urlMatches = text.match(URL_IN_MESSAGE) || [];
  const urlIndicators = [];
  const urlScores = [];
  let linkRisk = 0;
  for (const u of urlMatches) {
    const r = analyzeUrl(u, text);
    urlScores.push(r.riskScore);
    if (r.riskScore > 30) linkRisk += r.riskScore - 20;
    urlIndicators.push(...r.indicators.map((i) => ({ ...i, url: r.url })));
  }
  if (urlMatches.length) {
    detected.push('suspiciousLink');
    evidenceBySignal.suspiciousLink = urlMatches.slice(0, 3);
  }

  // Build weighted signals
  const signals = [];
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
  dims.linkRisk = Math.min(100, linkRisk + (urlMatches.length ? 20 : 0));

  for (const k of Object.keys(dims)) dims[k] = Math.min(100, Math.round(Math.max(dims[k], raw / 12)));

  const seq = [...detected].filter((d) => d !== 'suspiciousLink');
  if (urlMatches.length) seq.push('suspiciousLink');
  if (grammarSignal) seq.push('grammar');

  // Category selection (primary-signal + context rules)
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

  // risk score with grammar/modifier
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
  const urlBonus = Math.min(15, urlMatches.length * 6);
  let riskScore = Math.min(98, Math.round(rawScore + comboBonus + grammarPct + urlBonus));
  const maxUrlRisk = urlScores.length ? Math.max(...urlScores) : 0;
  if (type === 'url' && maxUrlRisk > 0) {
    // For a pure URL submission, the link's own structure is the dominant signal.
    riskScore = Math.min(98, Math.max(riskScore, Math.round(riskScore * 0.35 + maxUrlRisk * 0.65)));
    if (maxUrlRisk >= 40 && categoryId === 'unknown') categoryId = 'phishing';
    const textSignals = detected.filter((d) => d !== 'suspiciousLink' && d !== 'grammar');
    if (maxUrlRisk < 40 && categoryId === 'impersonation' && textSignals.length <= 1) categoryId = 'unknown';
  }
  if (text.length < 20 && riskScore > 30) {
    riskScore = Math.max(10, Math.round(riskScore * 0.7));
  }
  if (!seq.length) riskScore = Math.max(6, riskScore);

  const level = findLevel(riskScore);
  const category = findCategory(categoryId);

  // Confidence
  const strong = ['otp', 'credential', 'payment', 'tooGood', 'reward', 'fear'].filter((s) => touched.has(s)).length;
  let confidence = Math.min(96, 44 + touched.size * 6 + strong * 5 + (urlMatches.length ? 4 : 0));
  if (text.length < 15 && !urlMatches.length) confidence = Math.min(confidence, 45);
  const confidenceLabel = confidence >= 80 ? 'HIGH' : confidence >= 55 ? 'MODERATE' : 'LOW';

  // Requested information
  const requestedInformation = [];
  if (detected.includes('otp')) requestedInformation.push({ kind: 'OTP / verification code', sensitivity: 'CRITICAL' });
  if (detected.includes('credential')) requestedInformation.push({ kind: 'Login / account credentials', sensitivity: 'CRITICAL' });
  if (detected.includes('payment')) requestedInformation.push({ kind: 'Payment, transfer, or financial details', sensitivity: 'CRITICAL' });
  if (/date of birth|dob|address|phone number/i.test(text)) requestedInformation.push({ kind: 'Personal identifying details', sensitivity: 'HIGH' });

  // Manipulation tactics
  const tactics = [];
  const mkTactic = (name, on, blurb) => tactics.push({ name, detected: on, blurb });
  mkTactic('Urgency', detected.includes('urgency') || detected.includes('fear'), 'Compressing the time a victim has to think.');
  mkTactic('Authority lure', detected.includes('authority') || detected.includes('impersonation'), 'Borrowing a trusted identity to lower suspicion.');
  mkTactic('Fear / intimidation', detected.includes('fear'), 'Threatening consequences to override caution.');
  mkTactic('Reward bait', detected.includes('reward') || detected.includes('tooGood'), 'Dangling a reward to distract from requests.');
  mkTactic('Scarcity', /limited|last chance|only today|few (seats|slots)/i.test(text), 'Claiming limited availability to force action.');
  mkTactic('Pretexting', detected.includes('bypass') || detected.includes('romance'), 'Building a false reason for the interaction.');
  mkTactic('Channel-jumping', detected.includes('bypass'), 'Moving the conversation to unmonitored channels.');
  mkTactic('Trust misdirection', detected.includes('impersonation') || categoryId === 'impersonation', 'Positioning the attacker as the trusted authority.');

  // Reasons (explainability)
  const reasons = [];
  let n = 1;
  const reasonOrder = ['urgency', 'fear', 'reward', 'tooGood', 'credential', 'otp', 'payment', 'bypass', 'employment', 'investment', 'romance', 'techSupport', 'delivery', 'authority', 'suspiciousLink', 'grammar'];
  for (const code of reasonOrder) {
    if (!seq.includes(code)) continue;
    const ev = (evidenceBySignal[code] || []).join(' · ');
    const baseW = code === 'suspiciousLink' ? 24 : (WEIGHTS[code] ? WEIGHTS[code].base : 6);
    const contribution = baseW >= 26 ? 'HIGH' : baseW >= 18 ? 'MEDIUM' : 'LOW';
    const label = code === 'suspiciousLink' ? 'Suspicious Link' : SIGNAL_LABELS[code];
    const explanation = code === 'suspiciousLink'
      ? 'The destination structure carries risk indicators and should be independently verified before opening.'
      : SIGNAL_EXPLANATIONS[code] || 'This pattern contributes to the overall risk assessment.';
    reasons.push({ n, title: label, tone: contribution === 'HIGH' ? 'red' : contribution === 'MEDIUM' ? 'orange' : 'yellow', contribution, explanation, evidence: ev });
    n++;
  }
  if (type === 'url' && maxUrlRisk > 0) {
    const inds = urlIndicators.map((i) => i.label).slice(0, 4).join(' · ');
    reasons.push({
      n,
      title: 'URL Structure Risk',
      tone: maxUrlRisk >= 40 ? 'red' : 'yellow',
      contribution: maxUrlRisk >= 40 ? 'HIGH' : 'MEDIUM',
      explanation: 'The link itself carries structural indicators commonly found in phishing infrastructure and should never be opened before verification through official channels.',
      evidence: inds || 'Link present',
    });
    n++;
  }

  // Attack chain by category
  function chainFor(catId) {
    const base = [
      { label: 'Suspicious message received', description: 'A message arrives through a channel the user already trusts enough to read.' },
      { label: 'User engages with the bait', description: 'Curiosity, reward, fear or pressure prompts the user to click, reply or open.' },
      { label: 'User lands on a deceptive page / contact', description: 'A lookalike login page, payment form, or fake official contact continues the story.' },
      { label: 'Sensitive information or money is provided', description: 'Credentials, an OTP, a payment, or personal details are shared with the attacker.' },
      { label: 'Account or funds are compromised', description: 'The attacker uses what was shared to take over accounts or move money.' },
      { label: 'Downstream impact', description: 'Further fraud can extend to identity theft or misuse of the leaked data.' },
    ];
    if (catId === 'fake_prize' || catId === 'delivery_scam') {
      return [
        { label: 'Suspicious reward / parcel message received', description: 'The message promises a prize or parcel, and asks for a "small" payment to release it.' },
        { label: 'User pays a "processing fee"', description: 'A fee is requested to unlock the claimed benefit.' },
        { label: 'More charges appear', description: 'Further "taxes", "charges" or "penalties" are requested before delivery.' },
        { label: 'The prize never arrives', description: 'The "benefit" never materialises and the attacker disappears.' },
        { label: 'Money lost, details exposed', description: 'The user has lost money and shared personal or financial details.' },
      ];
    }
    return base;
  }

  // Recommended actions
  const recommendedActions = [
    "Don't click links or open attachments in this message.",
    "Don't share passwords, OTPs, PINs, or card details.",
    "Verify the claim through the official channel (official app, public phone number, or org website).",
    "If money was already sent, contact your bank/provider immediately.",
    "Report and block the sender where your platform allows it.",
  ];
  const addAction = (a) => { if (!recommendedActions.includes(a)) recommendedActions.push(a); };
  if (categoryId === 'fake_prize' || categoryId === 'investment_scam') addAction('Treat any offer of large free money or guaranteed returns as a red flag.');
  if (categoryId === 'job_scam') addAction("Legitimate employers don't charge fees or interview only on messaging apps.");
  if (detected.includes('otp')) addAction('A bank will never ask you to share an OTP by message — never forward it.');
  if (categoryId === 'delivery_scam') addAction('Check your tracking through the official courier site, not the link provided.');

  // Safe reply
  const safeReply = "Thank you for your message. I don't share personal, financial, or verification details through unsolicited messages. I'll verify this request directly through your organisation's official contact channel before taking any action.";

  // Evidence / inference / uncertainty
  const evidenceList = [];
  for (const code of seq) {
    for (const e of (evidenceBySignal[code] || []).slice(0, 3)) {
      evidenceList.push(`Detected phrase: "${e}" (${code === 'suspiciousLink' ? 'link present' : code})`);
    }
  }
  for (const g of grammar) evidenceList.push(`Stylistic observation: ${g}`);
  if (!evidenceList.length) evidenceList.push('No high-confidence marker phrases were matched in the supplied content.');

  const inferenceList = [];
  if (detected.includes('reward') || detected.includes('tooGood')) inferenceList.push('The reward framing suggests a possible bait-and-fee scam pattern.');
  if (detected.includes('otp') || detected.includes('credential')) inferenceList.push('Requests for secrets are a strong potential account-takeover pattern.');
  if (detected.includes('urgency') || detected.includes('fear')) inferenceList.push('Created urgency is often used to bypass the user\'s normal caution.');
  if (urlIndicators.some((u) => u.status === 'danger' || u.status === 'warning')) inferenceList.push('The referenced destination shows phishing-style structural characteristics.');
  if (!inferenceList.length) inferenceList.push('Limited strong markers present; remaining risk is driven by ambiguous signals.');

  const uncertaintyList = [
    "This is a pattern-based assessment. The sender's actual intent cannot be established from content alone.",
    'The score reflects the strength of suspicious signals, not proof of guilt.',
    'Independently verify any genuine-looking service through its official channels.',
  ];

  // Summary
  let summary;
  if (riskScore >= 60) {
    summary = `Strong suspicious patterns were detected consistent with ${category.label.toLowerCase()}. The message uses ${detected.length} distinct manipulation signals (${touched.size} signal classes) and should not be acted upon before independent verification.`;
  } else if (riskScore >= 40) {
    summary = `The message shows some suspicious characteristics (${touched.size} signal classes detected). It is not clearly safe; verify before trusting or replying with any detail.`;
  } else {
    summary = 'No strong fraudulent patterns were detected in the supplied content. Remain cautious: absence of detected signals is not proof that a message is genuine.';
  }

  const outcomeText =
    riskScore >= 60 ? 'LIKELY SUSPICIOUS — HIGH-RISK INDICATORS DETECTED'
    : riskScore >= 40 ? 'POTENTIAL PHISHING PATTERN — VERIFY BEFORE ACTING'
    : 'NO STRONG THREAT PATTERNS DETECTED — STAY CAUTIOUS';

  const disclaimers = [
    'AI-generated assessment — not a guarantee.',
    riskScore >= 40 ? 'High-risk indicators detected — treat before verifying.' : 'Assessment is based on pattern matching, not proof of intent.',
  ];

  return {
    riskScore,
    riskLevel: level.level,
    riskLabel: level.label,
    riskTone: level.tone,
    category: { id: category.id, label: category.label, icon: category.icon, tone: category.tone },
    outcomeText,
    summary,
    dimensions: DIMENSION_DEFS.map((d) => ({ ...d, score: dims[d.key] })),
    reasons,
    manipulationTactics: tactics.filter((t) => t.detected),
    requestedInformation,
    urlIndicators,
    recommendedActions,
    safeReply,
    attackChain: chainFor(categoryId),
    confidence,
    confidenceLabel,
    evidenceBasis: { evidence: evidenceList, inference: inferenceList, uncertainty: uncertaintyList },
    disclaimers,
  };
}

export { CATEGORIES, RISK_LEVELS };