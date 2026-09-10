// ScamShield AI — Rules-based Threat Intelligence Engine
// PRIMARY MARKET: Pakistan
// Signals, trusted domains, and demo scenarios are calibrated for
// Pakistani users — HBL, MCB, UBL, Meezan, JazzCash, EasyPaisa,
// NADRA CNIC, FBR, SBP, and Pakistani telecom/digital platforms.

const CATEGORIES = [
  { id: 'phishing',          label: 'Phishing',                        icon: 'phishing',   tone: 'orange' },
  { id: 'fake_prize',        label: 'Fake Prize / Lucky Draw',         icon: 'gift',       tone: 'red'    },
  { id: 'job_scam',          label: 'Fake Job Offer',                  icon: 'briefcase',  tone: 'orange' },
  { id: 'investment_scam',   label: 'Investment / Forex Scam',         icon: 'trending',   tone: 'red'    },
  { id: 'payment_scam',      label: 'Payment / Fee Scam',              icon: 'creditcard', tone: 'red'    },
  { id: 'impersonation',     label: 'Bank / Government Impersonation', icon: 'users',      tone: 'orange' },
  { id: 'account_takeover',  label: 'Account Takeover Attempt',        icon: 'key',        tone: 'red'    },
  { id: 'delivery_scam',     label: 'Parcel / Delivery Scam',          icon: 'package',    tone: 'orange' },
  { id: 'romance',           label: 'Romance / Social Engineering',    icon: 'heart',      tone: 'orange' },
  { id: 'tech_support',      label: 'Tech Support Scam',               icon: 'wrench',     tone: 'orange' },
  { id: 'unknown',           label: 'Unknown Suspicious Pattern',      icon: 'shield',     tone: 'yellow' },
];

const RISK_LEVELS = [
  { max: 19,  level: 'safe',       label: 'LIKELY SAFE',   tone: 'green'  },
  { max: 39,  level: 'low',        label: 'LOW RISK',      tone: 'green'  },
  { max: 59,  level: 'suspicious', label: 'SUSPICIOUS',    tone: 'yellow' },
  { max: 79,  level: 'high',       label: 'HIGH RISK',     tone: 'orange' },
  { max: 100, level: 'critical',   label: 'CRITICAL',      tone: 'red'    },
];

function findLevel(score) {
  return RISK_LEVELS.find((l) => score <= l.max);
}
function findCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNAL PATTERNS — Pakistan-calibrated
// ─────────────────────────────────────────────────────────────────────────────
const RE = {

  // Urgency — English + Roman Urdu
  urgency: [
    /urgent/i,
    /\bفوری\b/,                           // Fori (urgent) — Urdu
    /\bابھی\b/,                           // Abhi (right now)
    /\bimmediately\b/i,
    /right now/i,
    /act now/i,
    /\basap\b/i,
    /within\s*\d+\s*(hour|ghante|minute)/i,
    /aaj raat tak/i,                      // "by tonight"
    /kal tak/i,                           // "by tomorrow"
    /last chance/i,
    /don'?t miss/i,
    /limited time/i,
    /hurry/i,
    /jaldi karen/i,                       // "please hurry"
    /jaldi karo/i,
    /foran/i,                             // "immediately" in Urdu romanized
    /abhi reply karen/i,
    /turant/i,                            // "immediately"
    /expire (ho|kar) (raha|rahi)/i,       // "expiring"
    /kal expire/i,
  ],

  // Fear / Threats — Pakistani context
  fear: [
    /your (account|card|wallet) (will be|has been) (blocked|suspended|locked)/i,
    /account.*(blocked|suspended|band|freeze)/i,
    /\bapka account band\b/i,             // "your account will be closed"
    /legal action/i,
    /\barrest\b/i,
    /\bFIA\b/,                            // Federal Investigation Agency Pakistan
    /\bNAB\b/,                            // National Accountability Bureau
    /court notice/i,
    /\bwarrant\b/i,
    /penalty/i,
    /\bjurmanah\b/i,                      // "fine/penalty" in Urdu
    /case darj/i,                         // "case registered"
    /muqadma/i,                           // "lawsuit/case"
    /band ho jayega/i,                    // "will be closed"
    /block ho jayega/i,
    /suspend (kar diya|ho jayega)/i,
    /your (cnic|sim|number) (will be|has been) (blocked|suspended)/i,
    /sim (band|block) ho jayegi/i,
    /tax (default|evasion|notice)/i,
    /\bFBR notice\b/i,                    // Federal Board of Revenue
  ],

  // Authority impersonation — Pakistani institutions
  authority: [
    // Banks
    /\bHBL\b/,                            // Habib Bank Limited
    /\bMCB\b/,                            // Muslim Commercial Bank
    /\bUBL\b/,                            // United Bank Limited
    /\bABL\b/,                            // Allied Bank Limited
    /\bBOK\b/,                            // Bank of Khyber
    /\bSME bank\b/i,
    /meezan bank/i,
    /bank alfalah/i,
    /askari bank/i,
    /faysal bank/i,
    /habib metropolitan/i,
    /standard chartered pakistan/i,
    /national bank of pakistan|NBP/i,
    /bank of punjab|BOP/i,
    /zarai taraqiati bank|ZTBL/i,
    // Digital wallets / mobile money (most common scam vector in PK)
    /\bJazzCash\b/i,
    /\bEasyPaisa\b/i,
    /\bNayaPay\b/i,
    /\bSadaPay\b/i,
    /\bUPaisa\b/i,
    /\bHBL Konnect\b/i,
    // Government & regulatory
    /\bNADRA\b/,                          // National Database & Registration Authority
    /\bFBR\b/,                            // Federal Board of Revenue
    /\bSBP\b/,                            // State Bank of Pakistan
    /\bPTA\b/,                            // Pakistan Telecom Authority
    /\bFIA\b/,
    /\bNAB\b/,
    /pakistan government/i,
    /wazarat/i,                           // "ministry"
    /prime minister (office|pakistan)/i,
    /BISP/i,                              // Benazir Income Support Programme
    /ehsaas (program|payment)/i,          // Ehsaas cash transfer
    /benazir (income|kafalat)/i,
    // Telecom
    /\bJazz\b/,
    /\bTelenor\b/i,
    /\bZong\b/i,
    /\bUfone\b/i,
    /\bSCO\b/i,                           // Special Communication Organization
    // E-commerce / platforms
    /daraz\.pk/i,
    /\bDaraz\b/i,
    /\bOLX\b/i,
    /foodpanda/i,
    /\bCareem\b/i,
    /\bInDrive\b/i,
    // International brands (often impersonated)
    /amazon|netflix|microsoft|google|whatsapp|apple|paypal/i,
    /facebook|instagram|tiktok|youtube/i,
    /courier|leopards|tcs|speedex|m&p|pakistan post/i,
  ],

  // Reward bait — Pakistani context
  reward: [
    /congratulations/i,
    /mubarak ho/i,                        // "congratulations" Urdu
    /mubarakbaad/i,
    /you (have )?been selected/i,
    /ap ka number (lucky draw|nikla)/i,   // "your number came out in lucky draw"
    /lucky draw/i,
    /you ('ve| have) won/i,
    /jeet liya/i,                         // "you have won"
    /prize/i,
    /inaam/i,                             // "reward/prize" Urdu
    /reward/i,
    /claim (your|the)/i,
    /lottery/i,
    /gift (card|voucher)/i,
    /hamper/i,
    /inam nikla/i,                        // "prize came out"
    /selected.*reward/i,
    /HBL lucky draw/i,
    /Meezan (prize|lucky|inaam)/i,
    /Jazz (prize|lucky|winner)/i,
    /Telenor (prize|lucky|winner)/i,
  ],

  // Too-good-to-be-true financial claims — Pakistani PKR + crypto
  tooGood: [
    /(?:PKR|Rs\.?|rupees?)\s*[\d,]{4,}/i,   // PKR amounts
    /\d+\s*(lakh|lac|crore|thousand)/i,      // South Asian number notation
    /double your (money|investment|paisa)/i,
    /guaranteed (profit|return|munafa|kamai)/i,
    /earn\s*(per day|daily|rozana)/i,
    /\d+%\s*(daily|weekly|monthly|rozana)\s*(return|profit|munafa)/i,
    /easy (money|earning|paisa|kamai)/i,
    /get rich/i,
    /ghar baithe kamai/i,                    // "earn from home"
    /rozana\s*(?:PKR|Rs\.?)?\s*[\d,]+/i,    // daily PKR amount
    /invest.*guaranteed/i,
    /120% (return|profit)/i,
    /aik hafte mein double/i,                // "double in one week"
  ],

  // Credential harvesting
  credential: [
    /password/i,
    /passcode/i,
    /login (credentials|details|id|info)/i,
    /update your (password|pin|credentials)/i,
    /verify your (account|identity|login)/i,
    /apna (password|pin) (batayein|share|dein)/i,  // "tell us your password"
    /confirm (your )?(account|identity|details)/i,
    /enter your (login|user id|username)/i,
    /unlock (your )?account/i,
    /account verify (karein|karo)/i,        // "verify your account"
    /\bcnic (number|details|copy)\b/i,      // CNIC — most critical in PK
    /\bnational id\b/i,
    /cnic share (karein|karo|bhejein)/i,
    /\bATM (pin|card)\b/i,
    /\bdebit card (details|number|pin)\b/i,
  ],

  // OTP / verification code theft
  otp: [
    /\botp\b/i,
    /one[- ]?time (password|code)/i,
    /share (the |your )?(code|otp)/i,
    /verification code/i,
    /confirm (the |your )?otp/i,
    /code (batayein|batao|send karein)/i,   // "tell the code"
    /code (bhejein|bhejo)/i,               // "send the code"
    /4 (digit|handa) code/i,
    /6 (digit|handa) code/i,
    /secret code/i,
    /SMS code/i,
    /code jo aaya hai/i,                   // "the code that came"
    /jazzcash code/i,
    /easypaisa code/i,
  ],

  // Payment / financial request — Pakistani methods
  payment: [
    /processing (fee|charge)/i,
    /registration (fee|amount)/i,
    /security (deposit|amount|raqam)/i,
    /advance (amount|payment|raqam)/i,
    /transfer (the |karein |karo )?(amount|money|raqam|paisa)/i,
    /send (money|funds|payment|paisa|raqam)/i,
    /JazzCash (par|ko|account|wallet)/i,   // "on JazzCash"
    /EasyPaisa (par|ko|account)/i,
    /NayaPay (par|ko)/i,
    /bank (transfer|account mein dal)/i,
    /IBFT/i,                               // Pakistan interbank transfer
    /raast (send|transfer)/i,              // Raast — Pakistan instant payment
    /account number (dein|bhejein)/i,
    /\batm se nikaalo\b/i,                  // "withdraw from ATM"
    /card (number|details|cvv)/i,
    /pay first/i,
    /pehle pay (karein|karo)/i,            // "pay first"
    /fee to (release|claim|unlock)/i,
    /fee deni hogi/i,                      // "you will have to pay a fee"
    /charges lagenge/i,                    // "charges will be applied"
  ],

  // Bypass official channels — Pakistan
  bypass: [
    /don'?t (tell|share) (anyone|this)/i,
    /kisi ko mat (batana|bolo)/i,          // "don't tell anyone"
    /secret (rakho|rakhein)/i,             // "keep it secret"
    /keep (this|it) (confidential|secret|private)/i,
    /contact me (directly|on whatsapp|on telegram)/i,
    /WhatsApp (par|pe) message (karein|karo)/i,
    /sirf WhatsApp pe/i,                   // "only on WhatsApp"
    /call this number/i,
    /is number pe call (karein|karo)/i,
    /don'?t call (support|helpline|bank)/i,
    /bank ko mat batana/i,                 // "don't tell the bank"
    /helpline pe mat (jao|call karo)/i,
    /off.?the.?record/i,
    /matter ko private rakhein/i,
  ],

  // Fake employment — Pakistan-specific job scam patterns
  employment: [
    /work from home/i,
    /ghar se kaam/i,                       // "work from home" Urdu
    /ghar baithe/i,                        // "sitting at home"
    /no (experience|experience needed)/i,
    /bina experience/i,
    /daily (salary|payment|payout)/i,
    /rozana (salary|payment|kamai)/i,
    /joining (bonus|amount|fee)/i,
    /interview on (whatsapp|zoom|telegram)/i,
    /WhatsApp pe interview/i,
    /earn per task/i,
    /YouTube (like|subscribe|view) (karein|task)/i,  // YouTube like scam (common in PK)
    /product (review|rating) task/i,
    /Amazon (task|rating|review) job/i,
    /copy.?paste (job|kaam)/i,
    /data entry.*(salary|kamai)/i,
    /online typing (job|kaam)/i,
    /free (training|course|laptop)/i,
    /enroll (now|today|abhi)/i,
    /sirf (500|1000|2000) (deposit|fee) pay (karein|karo)/i, // "just pay 500 deposit"
  ],

  // Investment / forex / crypto scam — very common in PK
  investment: [
    /guaranteed (returns|munafa|profit)/i,
    /double your (money|investment)/i,
    /crypto (investment|trading|signals)/i,
    /bitcoin|ethereum|usdt|tether/i,
    /forex (trading|signals|investment)/i,   // Forex scams huge in Pakistan
    /\bMLM\b/i,                              // Multi-level marketing
    /expert (trading|signals|tips)/i,
    /invest.*(daily|weekly) (return|profit|munafa)/i,
    /ROI (daily|weekly)/i,
    /\bBinance\b.*guaranteed/i,
    /\bolympus trader\b/i,
    /panel (mein|pe) (invest|dal)/i,         // "invest in the panel"
    /\bProfit (daily|weekly|monthly)\b/i,
    /stock (tips|recommendation)/i,
    /get rich/i,
    /pyramid (scheme|plan)/i,
    /referral (bonus|commission)/i,
    /early (access|investors)/i,
    /sirf\s*(?:PKR|Rs\.?)?\s*[\d,]+\s*(se|mein) (shuru|start)/i, // "start from just PKR X"
  ],

  // Romance scam — Pakistan-specific
  romance: [
    /hello (dear|sweet|beautiful|handsome|jaan|pyaare)/i,
    /\bjaan\b/i,                             // "dear/darling" Urdu
    /\bhabibi\b/i,                           // Arabic term of endearment used in PK
    /i (love|like|admire) you/i,
    /mujhe tumse (pyar|mohabbat)/i,          // "I love you" Urdu
    /send me.*(gift card|western union|easypaisa|jazzcash)/i,
    /need money.*(visa|ticket|hospital|operation)/i,
    /paise bhejein.*(operation|hospital|emergency)/i,
    /marry/i,
    /rishta (bhejein|bhejo)/i,               // "send a marriage proposal"
    /divorce.*(money|raqam)/i,
    /widow.*(investment|help|money)/i,       // Widow scam
    /widower.*(investment|help)/i,
  ],

  // Tech support scam
  techSupport: [
    /your (device|computer|pc|mobile|phone) (has|is) (a )?(virus|infected|hacked|compromised)/i,
    /apka (mobile|phone|device) (hack|virus|compromise) (ho gaya|hua)/i,
    /windows support/i,
    /microsoft (support|technician)/i,
    /call.*(this number|us immediately|abhi call)/i,
    /remote (access|support)/i,
    /TeamViewer (install|download)/i,       // Remote access tool scam
    /AnyDesk (install|download)/i,
    /app install (karein|karo)/i,
    /apna screen (share|dikhao)/i,          // "share your screen"
    /phone ko (access|control) (dein|do)/i,
  ],

  // Delivery / parcel scam
  delivery: [
    /package (awaiting|held|failed)/i,
    /parcel (roka|rok)/i,                   // "parcel stopped/held"
    /delivery (failed|attempted|pending)/i,
    /\bparcel\b/i,
    /Daraz (delivery|parcel|order)/i,       // Daraz.pk (biggest PK e-commerce)
    /customs (fee|duty|charge|charges)/i,
    /\bcustoms\b.*\bpay\b/i,
    /shipping (fee|charge)/i,
    /tracking (id|number)/i,
    /TCS (parcel|delivery)/i,               // TCS courier Pakistan
    /Leopards (parcel|delivery)/i,
    /M&P (parcel|delivery)/i,               // M&P courier Pakistan
    /Speedex (parcel|delivery)/i,
    /Pakistan Post (parcel|delivery)/i,
    /confirm your (address|details) to (receive|get)/i,
    /parcel (release|nikalne) ke liye (fee|charges) dein/i,
  ],

  // NADRA / CNIC / Government document scam — Pakistan-specific
  nadra: [
    /\bCNIC\b/,                             // Computerised National Identity Card
    /\bNICOP\b/,                            // National Identity Card for Overseas Pakistanis
    /\bB-Form\b/i,
    /NADRA (se|ki taraf se|office)/i,
    /cnic (expired|expire|band|block)/i,
    /cnic update (karein|karo)/i,
    /apna cnic (bhejein|send)/i,
    /cnic number (dein|batayein)/i,
    /identity card (verification|verify)/i,
    /sim (block|band) due to (cnic|identity)/i,  // SIM blocking scam
    /biometric (update|verify)/i,           // Biometric verification scam
    /PTA (ne|ki taraf se) sim (block|band)/i,    // PTA SIM block scam
  ],

  // BISP / Ehsaas / government welfare scam — massive in rural PK
  welfarescam: [
    /\bBISP\b/,                             // Benazir Income Support Programme
    /\behsaas\b/i,                          // Ehsaas programme
    /\bkafalat\b/i,                         // Kafalat program
    /benazir (payment|raqam|paisa)/i,
    /ehsaas (payment|raqam|program)/i,
    /sarkari (madad|payment|raqam)/i,       // "government assistance"
    /government (payment|raqam|madad)/i,
    /8171/,                                 // BISP helpline number often spoofed
    /bisp.*(register|verification|payment)/i,
    /ap (ka|ki) ehsaas raqam (ready|tayar) hai/i, // "your Ehsaas amount is ready"
    /verify (karein|karo) aur (raqam|paisa) lo/i, // "verify and take money"
  ],
};

const WEIGHTS = {
  urgency:      { base: 22, dims: { urgency: 4 } },
  fear:         { base: 22, dims: { socialEngineering: 3, urgency: 3 } },
  authority:    { base: 14, dims: { socialEngineering: 3, impersonation: 3 } },
  reward:       { base: 22, dims: { financialRisk: 3, socialEngineering: 2 } },
  tooGood:      { base: 26, dims: { financialRisk: 5 } },
  credential:   { base: 28, dims: { credentialRisk: 7, socialEngineering: 2 } },
  otp:          { base: 32, dims: { credentialRisk: 8 } },
  payment:      { base: 28, dims: { financialRisk: 5, credentialRisk: 2 } },
  bypass:       { base: 20, dims: { socialEngineering: 4 } },
  employment:   { base: 22, dims: { financialRisk: 3, socialEngineering: 2 } },
  investment:   { base: 26, dims: { financialRisk: 5 } },
  romance:      { base: 20, dims: { socialEngineering: 4 } },
  techSupport:  { base: 24, dims: { socialEngineering: 3, urgency: 2 } },
  delivery:     { base: 18, dims: { financialRisk: 2, socialEngineering: 2 } },
  nadra:        { base: 30, dims: { credentialRisk: 6, socialEngineering: 3 } },  // HIGH — CNIC theft
  welfarescam:  { base: 28, dims: { financialRisk: 4, socialEngineering: 4 } },   // HIGH — targets vulnerable
};

const SIGNAL_LABELS = {
  urgency:     'Urgent Language / Pressure',
  fear:        'Fear / Threat Language',
  authority:   'Authority Impersonation',
  reward:      'Prize / Reward Bait',
  tooGood:     'Too-Good-To-Be-True Claim',
  credential:  'Credential / CNIC Request',
  otp:         'OTP / Verification Code Request',
  payment:     'Payment / Financial Request',
  bypass:      'Pressure to Bypass Official Channels',
  employment:  'Fake Job / Task Offer Pattern',
  investment:  'Fake Investment Promise',
  romance:     'Romance / False-Pretext Bait',
  techSupport: 'Tech Support Scam Pattern',
  delivery:    'Parcel / Delivery Scam Pattern',
  nadra:       'CNIC / NADRA Identity Theft Attempt',
  welfarescam: 'Government Welfare Scam (BISP/Ehsaas)',
};

const SIGNAL_EXPLANATIONS = {
  urgency:     'Pressure to act before you can verify — a core scam tactic to prevent rational thinking.',
  fear:        'Threat of account suspension, legal action, or SIM block to force immediate compliance.',
  authority:   'The message claims to be from a trusted Pakistani bank, government body, or platform.',
  reward:      'An attractive prize is offered — often to bait a "small fee" request that follows.',
  tooGood:     'The promised return far exceeds what any legitimate financial product offers.',
  credential:  'The message nudges toward sharing CNIC, login credentials, or ATM PIN.',
  otp:         'Requesting a one-time code from JazzCash, EasyPaisa, or a bank is always a scam.',
  payment:     'Steering toward a payment via JazzCash, EasyPaisa, IBFT, or Raast.',
  bypass:      'Asking to keep the matter secret or move to WhatsApp to avoid official oversight.',
  employment:  'Patterns common to fake task-based or typing-job scams popular in Pakistan.',
  investment:  'Forex/crypto/MLM promises of guaranteed returns — illegal and fraudulent.',
  romance:     'Building false emotional trust to extract money or gifts.',
  techSupport: 'Claiming your device is hacked to gain remote access (TeamViewer/AnyDesk).',
  delivery:    'Claiming a parcel is held to collect customs fees or payment details.',
  nadra:       'Attempting to extract CNIC number, copy, or biometric data — serious identity theft risk.',
  welfarescam: 'Impersonating BISP/Ehsaas to trick beneficiaries into sharing details or paying fees.',
};

const DIMENSION_DEFS = [
  { key: 'socialEngineering', label: 'Social Engineering', color: '#f59e0b' },
  { key: 'linkRisk',          label: 'Link Risk',           color: '#f97316' },
  { key: 'urgency',           label: 'Urgency',             color: '#ef4444' },
  { key: 'credentialRisk',    label: 'Credential Risk',     color: '#a855f7' },
  { key: 'financialRisk',     label: 'Financial Risk',      color: '#ec4899' },
];

// ─── Trusted official Pakistani domains (false-positive protection) ──────────
const TRUSTED_DOMAINS = new Set([
  // Pakistani Banks (official)
  'hbl.com','mcb.com.pk','ubl.com.pk','abl.com','meezanbank.com',
  'bankalfalah.com','askaribank.com.pk','faysalbank.com','jsbl.com',
  'nbp.com.pk','bop.com.pk','summit-bank.com.pk','smebank.com.pk',
  'bok.com.pk','standardchartered.com.pk','habibmetro.com',
  'silkbankltd.com','syndicatebank.com.pk',
  // Pakistani mobile wallets / fintech
  'jazzcash.com.pk','easypaisa.com.pk','nayapay.com','sadapay.com',
  'upaisa.com','hblkonnect.com',
  // Pakistani Government
  'nadra.gov.pk','fbr.gov.pk','sbp.org.pk','pta.gov.pk','bisp.gov.pk',
  'ehsaas.gov.pk','pakistan.gov.pk','fia.gov.pk','nab.gov.pk',
  'moitt.gov.pk','pmdu.edu.pk',
  // Pakistani Telecom
  'jazz.com.pk','telenor.com.pk','zong.com.pk','ufone.com',
  // Pakistani e-commerce / platforms
  'daraz.pk','olx.com.pk','foodpanda.pk','careem.com',
  // International (commonly impersonated in PK)
  'amazon.com','google.com','microsoft.com','apple.com',
  'paypal.com','facebook.com','instagram.com','whatsapp.com',
  'youtube.com','tiktok.com','linkedin.com',
  'fedex.com','dhl.com',
]);

// Scam domain patterns for Pakistan
const SCAM_DOMAIN_PATTERNS = [
  /hbl[^.]*\.(xyz|top|online|site|club|info|tk|ml|ga|cf|gq)/i,
  /mcb[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /ubl[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /meezan[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /alfalah[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /jazzcash[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /easypaisa[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /nadra[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /bisp[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /ehsaas[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /jazz[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /telenor[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /fbr[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /sbp[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /daraz[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /pakistan[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /govt[^.]*\.(xyz|top|online|site|club|info|tk|ml)/i,
  /(verify|secure|update|login|account|cnic|kyc|biometric)[^.]{0,20}\.(xyz|top|online|site|club|info|tk|ml)/i,
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

// ─── Phone number scam detection — Pakistan context ──────────────────────────
function analyzePhoneNumbers(text) {
  const signals = [];
  // WhatsApp / Telegram redirect (most common bypass in PK)
  if (/WhatsApp (par|pe|ko) (message|contact|call) (karein|karo)/i.test(text) ||
      /message\s+(me|us)\s+(on|via|at)?\s*(whatsapp|telegram|signal)/i.test(text) ||
      /sirf WhatsApp pe/i.test(text) ||
      /contact.*whatsapp/i.test(text)) {
    signals.push({ label: 'WhatsApp Contact Redirect', severity: 'high', detail: 'Redirecting to WhatsApp avoids official bank/government channels — classic scam bypass tactic in Pakistan.' });
  }
  // Pakistani number format +92 with action verb
  if (/(\+92|0092|0[3][0-9]{9})/.test(text) &&
      /(call|contact|reach|message|whatsapp|add)/i.test(text)) {
    signals.push({ label: 'Unverified Pakistani Number as Contact', severity: 'medium', detail: 'A +92 number is promoted as the contact point, bypassing official helplines.' });
  }
  // Spoofed helpline numbers (8171 BISP, 111-xxx-xxx bank patterns)
  if (/8171/.test(text)) {
    signals.push({ label: 'BISP Helpline Number (8171) Mentioned', severity: 'high', detail: 'Scammers frequently spoof the BISP 8171 helpline number to impersonate the government welfare programme.' });
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

  // ── Brand mismatch (Pakistan-context-aware) ───────────────────────────────
  if (context) {
    const brandPatterns = [
      { rx: /\bHBL\b/,                      domain: 'hbl.com' },
      { rx: /\bMCB\b/,                      domain: 'mcb.com.pk' },
      { rx: /\bUBL\b/,                      domain: 'ubl.com.pk' },
      { rx: /\bMeezan\b/i,                  domain: 'meezanbank.com' },
      { rx: /\bBank Alfalah\b/i,            domain: 'bankalfalah.com' },
      { rx: /\bJazzCash\b/i,                domain: 'jazzcash.com.pk' },
      { rx: /\bEasyPaisa\b/i,               domain: 'easypaisa.com.pk' },
      { rx: /\bNADRA\b/,                    domain: 'nadra.gov.pk' },
      { rx: /\bBISP\b/,                     domain: 'bisp.gov.pk' },
      { rx: /\bEhsaas\b/i,                  domain: 'ehsaas.gov.pk' },
      { rx: /\bFBR\b/,                      domain: 'fbr.gov.pk' },
      { rx: /\bSBP\b/,                      domain: 'sbp.org.pk' },
      { rx: /\bPTA\b/,                      domain: 'pta.gov.pk' },
      { rx: /\bDaraz\b/i,                   domain: 'daraz.pk' },
      { rx: /\bJazz\b/,                     domain: 'jazz.com.pk' },
      { rx: /\bTelenor\b/i,                 domain: 'telenor.com.pk' },
      { rx: /\bamazon\b/i,                  domain: 'amazon.com' },
      { rx: /\bpaypal\b/i,                  domain: 'paypal.com' },
      { rx: /\bgoogle\b/i,                  domain: 'google.com' },
      { rx: /\bmicrosoft\b/i,               domain: 'microsoft.com' },
      { rx: /\bapple\b/i,                   domain: 'apple.com' },
    ];
    for (const { rx, domain } of brandPatterns) {
      if (rx.test(context) && !host.includes(domain.replace('.com.pk','').replace('.gov.pk','').replace('.org.pk','').replace('.pk','').replace('.com',''))) {
        add('Brand / Domain Mismatch', 'danger', `Message references "${domain.split('.')[0].toUpperCase()}" but the URL domain "${rootDomain}" does not match the official address. This is the #1 sign of a phishing link.`);
        score += 32;
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

  // Category selection — Pakistan-calibrated priority
  let categoryId = 'unknown';
  const P = (s) => detected.includes(s);
  if (P('nadra'))                                                     categoryId = 'account_takeover'; // CNIC theft = account takeover
  else if (P('welfarescam'))                                          categoryId = 'fake_prize';       // BISP/Ehsaas scam
  else if (P('otp'))                                                  categoryId = 'account_takeover';
  else if (P('techSupport'))                                          categoryId = 'tech_support';
  else if (P('authority') && (P('credential') || P('otp') || P('payment') || P('nadra'))) categoryId = 'impersonation';
  else if (P('investment'))                                           categoryId = 'investment_scam';
  else if (P('employment'))                                           categoryId = 'job_scam';
  else if (P('delivery'))                                             categoryId = 'delivery_scam';
  else if (P('romance'))                                              categoryId = 'romance';
  else if (P('credential') && P('suspiciousLink'))                    categoryId = 'phishing';
  else if (P('reward') || P('tooGood'))                               categoryId = 'fake_prize';
  else if (P('payment'))                                              categoryId = 'payment_scam';
  else if (P('authority'))                                            categoryId = 'impersonation';

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
  combo('nadra', 'authority', 15);       // CNIC + authority = very dangerous
  combo('nadra', 'fear', 12);            // CNIC theft under threat
  combo('welfarescam', 'payment', 15);   // BISP scam + payment = critical
  combo('welfarescam', 'otp', 15);       // BISP + OTP theft
  combo('otp', 'payment', 12);           // JazzCash/EasyPaisa OTP scam
  // Phone redirect with payment/credential is very high risk
  if (phoneSignals.length && (P('payment') || P('credential') || P('otp') || P('nadra'))) comboBonus += 14;

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

  // Requested information — Pakistan-specific
  const requestedInformation = [];
  if (P('otp'))        requestedInformation.push({ kind: 'OTP / JazzCash / EasyPaisa verification code', sensitivity: 'CRITICAL' });
  if (P('nadra'))      requestedInformation.push({ kind: 'CNIC number / National Identity Card details', sensitivity: 'CRITICAL' });
  if (P('credential')) requestedInformation.push({ kind: 'Login credentials / account password / ATM PIN', sensitivity: 'CRITICAL' });
  if (P('payment'))    requestedInformation.push({ kind: 'Payment via JazzCash / EasyPaisa / bank transfer', sensitivity: 'CRITICAL' });
  if (/cvv|card number|expiry|debit|credit card/i.test(text)) requestedInformation.push({ kind: 'Debit / credit card details', sensitivity: 'CRITICAL' });
  if (/biometric|fingerprint|thumb impression/i.test(text))   requestedInformation.push({ kind: 'Biometric / fingerprint data', sensitivity: 'CRITICAL' });
  if (/mobile number|phone number|sim number/i.test(text) && riskScore > 30) requestedInformation.push({ kind: 'Mobile / SIM number', sensitivity: 'HIGH' });
  if (/address|ghar ka pata|residential/i.test(text) && riskScore > 30)      requestedInformation.push({ kind: 'Home address / residential details', sensitivity: 'HIGH' });

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
  const reasonOrder = ['otp','nadra','credential','welfarescam','payment','fear','urgency','reward','tooGood','authority','bypass','employment','investment','romance','techSupport','delivery','suspiciousLink','grammar'];
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