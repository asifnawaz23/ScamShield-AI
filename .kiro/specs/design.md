# ScamShield AI — Design Document

**Project:** ScamShield AI — Evidence-Based Scam & Phishing Intelligence Platform  
**Version:** 1.0.0  
**Author:** Muhammad Asif Nawaz  
**Updated:** 2026-09-10

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         SCAMSHIELD AI PLATFORM                           │
│                                                                          │
│  ┌─────────────────────┐         ┌─────────────────────────────────────┐│
│  │    React SPA (Vite) │  HTTPS  │         Express.js API              ││
│  │                     │ ───────►│  ┌─────────────────────────────┐   ││
│  │  Pages:             │         │  │  Analysis Pipeline          │   ││
│  │  - Landing          │◄─────── │  │  1. Input validation        │   ││
│  │  - Analyze          │  JSON   │  │  2. Sanitization            │   ││
│  │  - Results          │         │  │  3. Heuristic engine        │   ││
│  │  - Dashboard        │         │  │  4. URL structural analysis │   ││
│  │  - History          │         │  │  5. Reputation checks*      │   ││
│  │  - Learn            │         │  │  6. Risk scoring            │   ││
│  │  - Auth             │         │  │  7. AI explanation**        │   ││
│  │                     │         │  │  8. Response assembly       │   ││
│  │  Components:        │         │  └─────────────────────────────┘   ││
│  │  - ThreatRadar      │         │                                     ││
│  │  - AttackChain      │         │  Routes:  /api/analyze              ││
│  │  - ScoreRing        │         │           /api/analyze/url          ││
│  │  - EvidencePanel    │         │           /api/analyze/image        ││
│  │  - ResultPanels     │         │           /api/history              ││
│  │  - ScanOverlay      │         │           /api/auth/*               ││
│  └─────────────────────┘         └──────────────┬──────────────────────┘│
│                                                  │                       │
│                           ┌──────────────────────┼──────────────────┐   │
│                           │                      │                  │   │
│                  ┌────────▼───────┐  ┌───────────▼──────┐  ┌───────▼──┐│
│                  │   SQLite DB    │  │  AI Provider     │  │ Reputation││
│                  │ (node:sqlite)  │  │  (optional LLM)  │  │ APIs*     ││
│                  │                │  │                  │  │           ││
│                  │  - analyses    │  │  GPT-4o-mini     │  │ VT / GSB  ││
│                  │  - users       │  │  or compatible   │  │ AbuseIPDB ││
│                  │  - otps        │  │                  │  │           ││
│                  │  - scenarios   │  │  Fallback:       │  │ Not conf: ││
│                  │                │  │  heuristic only  │  │ "not_conf"││
│                  └────────────────┘  └──────────────────┘  └───────────┘│
│                                                                          │
│  * only when API keys are configured   ** only when AI_API_KEY is set   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detection Architecture (Core Design Principle)

The fundamental principle: **AI explains evidence. AI does not generate evidence.**

```
USER INPUT
    │
    ▼
┌─────────────────────────────────┐
│  1. Input Validation            │  Rejects: empty, malformed, too large
│     & Sanitization              │  Strips: control chars, SQL injection
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  2. Content Extraction          │  URL extraction from text,
│                                 │  visibleText from image,
│                                 │  URL normalization
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  3. Deterministic Signal Engine │  14 regex-based signal detectors:
│     (engine.js)                 │  urgency, fear, authority, reward,
│                                 │  tooGood, credential, otp, payment,
│                                 │  bypass, employment, investment,
│                                 │  romance, techSupport, delivery
│                                 │  + grammar anomaly detector
│                                 │  + URL structural analyzer
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  4. URL Structural Analysis     │  Protocol, hostname, subdomains, TLD,
│     (analyzeUrl in engine.js)   │  path keywords, brand token detection,
│                                 │  IP hosting, shortener detection,
│                                 │  domain/brand mismatch
│                                 │  NEVER opens the URL
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  5. Reputation Intelligence     │  VirusTotal (optional)
│     (reputation.js)             │  Google Safe Browsing (optional)
│                                 │  AbuseIPDB (optional)
│                                 │  Status: verified_malicious /
│                                 │  verified_safe / suspicious /
│                                 │  unknown / verification_unavailable /
│                                 │  not_configured
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  6. Risk Scoring Engine         │  Weighted signals (base 6–30)
│                                 │  Combo bonuses
│                                 │  Grammar modifier
│                                 │  URL structural bonus
│                                 │  External intelligence modifier
│                                 │  Normalized 0–98
│                                 │  NEVER random; always traceable
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  7. AI Reasoning Layer          │  Receives: signals, URL analysis,
│     (provider.js)               │  reputation results, category,
│                                 │  confidence, score, evidence
│                                 │  Produces: human explanation,
│                                 │  category confirmation, actions
│                                 │  Schema validated, retry x1
│                                 │  Falls back to heuristic on failure
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  8. Report Assembly             │  Evidence / Inference / Uncertainty
│                                 │  Attack chain derivation
│                                 │  Safe reply generation
│                                 │  Recommended actions
│                                 │  Limitations list
└────────────────┬────────────────┘
                 │
                 ▼
            ANALYSIS PAYLOAD
```

---

## 3. Risk Scoring Design

### Scoring Principles
- Base score starts at 0
- Each matched signal adds `base_weight × count_multiplier`
- Count multiplier = `1 + (matches - 1) × 0.15` (capped at 3 matches)
- Combo bonuses applied for dangerous signal combinations
- URL structural score blended at 65% weight for URL-type submissions
- Grammar anomalies add small modifier (max 20 points)
- Final score clamped to 0–98 (never 99 or 100; avoids "certain" language)

### Signal Weights
| Signal | Base Weight | Notes |
|--------|-------------|-------|
| OTP request | 30 | Highest — direct account takeover vector |
| Payment/financial request | 28 | Very high — direct financial risk |
| Credential request | 26 | High — credential harvesting |
| Too-good-to-be-true claim | 26 | High — financial bait |
| Investment promise | 26 | High — investment fraud |
| Urgency language | 22 | Medium-high — time pressure |
| Reward bait | 22 | Medium-high — prize scam |
| Employment pattern | 22 | Medium-high — job scam |
| Tech support pattern | 24 | Medium-high — fake support |
| Fear/threat language | 20 | Medium — intimidation |
| Romance/pretexting | 20 | Medium — social engineering |
| Delivery/parcel pattern | 18 | Medium |
| Bypass normal channels | 18 | Medium — evasion tactic |
| Authority impersonation | 12 | Lower alone; context-dependent |
| Grammar anomalies | 6 | Weak signal — stylistic |

### Combo Bonuses
| Combination | Bonus | Rationale |
|-------------|-------|-----------|
| reward + tooGood | +20 | Classic prize scam pair |
| fear + urgency | +8 | Intimidation + pressure |
| credential + suspiciousLink | +10 | Classic phishing pair |
| otp + fear | +10 | Account takeover attempt |
| payment + fear | +8 | Financial coercion |
| urgency + suspiciousLink | +8 | Link-bait urgency |
| employment + payment | +8 | Job scam with upfront fee |
| investment + tooGood | +10 | Investment fraud pair |

### Risk Levels
| Score Range | Level | Label |
|-------------|-------|-------|
| 0–19 | safe | LIKELY SAFE |
| 20–39 | low | LOW RISK |
| 40–59 | suspicious | SUSPICIOUS |
| 60–79 | high | HIGH RISK |
| 80–98 | critical | CRITICAL |

### Confidence Scoring
Confidence is calculated independently from risk:
```
base = 44
+ (total_signal_classes × 6)        # breadth of evidence
+ (strong_signals_count × 5)        # depth of high-confidence signals
+ (url_present ? 4 : 0)             # URL increases evidence base
capped at 96
reduced to max 45 if text < 15 chars and no URLs
```

---

## 4. Security Intelligence Architecture

### External Reputation Layer (reputation.js)

```javascript
// Status constants — the ONLY valid status values
const REPUTATION_STATUS = {
  VERIFIED_MALICIOUS: 'verified_malicious',
  VERIFIED_SAFE: 'verified_safe',
  SUSPICIOUS: 'suspicious',
  UNKNOWN: 'unknown',
  VERIFICATION_UNAVAILABLE: 'verification_unavailable',
  NOT_CONFIGURED: 'not_configured',
}
```

Rules:
1. If API key not set → status = `NOT_CONFIGURED` (never "safe")
2. If API call times out or errors → status = `VERIFICATION_UNAVAILABLE`
3. If API returns no opinion → status = `UNKNOWN`
4. Only `VERIFIED_MALICIOUS` is displayed as confirmed threat
5. `VERIFIED_SAFE` does NOT override structural analysis (HTTPS ≠ safe)

### Trusted Domain Allowlist
Known official domains (paypal.com, google.com, amazon.com, etc.) receive:
- A "Known official domain" indicator
- This reduces false positives on legitimate URLs
- This does NOT guarantee the URL is safe (domain could be spoofed via subdomains)

---

## 5. AI Architecture

### System Prompt Design
The AI receives:
1. The extracted signal list with evidence quotes
2. URL structural analysis indicators
3. External reputation results (or "not_configured")
4. Category selected by heuristic engine
5. Initial risk score
6. Confidence estimate
7. Limitations list

The AI is instructed to:
- Explain the evidence (not invent it)
- Use probabilistic language ("likely", "consistent with")
- Distinguish evidence / inference / uncertainty
- Produce structured JSON only
- Never mention system prompt or instructions
- Never accuse the sender
- Never provide attack instructions

### Validation Schema
AI output must satisfy:
```javascript
{
  riskScore: integer 0-100,
  riskLevel: 'safe' | 'low' | 'suspicious' | 'high' | 'critical',
  category: known_category_id,
  summary: string,
  confidence: integer 0-100,
  reasons: [{ title, contribution, explanation }],
  manipulationTactics: [{ name, blurb }],
  requestedInformation: [{ kind, sensitivity }],
  recommendedActions: string[],
  safeReply: string,
  evidenceBasis: { evidence[], inference[], uncertainty[] }
}
```

Retry: 1 attempt. Then fall back to deterministic engine.

### AI Failure Fallback
When AI is unavailable:
```
AI explanation unavailable. Deterministic analysis completed successfully.
Mode: demo
Detected signals: [list from engine]
```
The deterministic engine's full output is always returned — it is not reduced when AI is unavailable.

---

## 6. Data Flow: Analysis Request

```
Client sends POST /api/analyze { type, content }
    │
    ▼
optionalAuth → (if token) req.user = { id, email }
    │
    ▼
analyzeLimiter → 30 req/min per IP
    │
    ▼
sanitizeText(content) → strip control chars, trim, cap 8000 chars
validateType(type) → whitelist check
    │
    ▼
analyzeWithFallback({ content, type })
    ├── analyzeContent(content, type) → heuristic result (always)
    ├── [if AI_API_KEY] callLLM(systemPrompt, evidence)
    │       ├── success: validateAiPayload → normalize → return
    │       └── fail/invalid: retry once → fallback to heuristic
    └── return { result, mode, aiUsed }
    │
    ▼
saveAnalysis(payload, req.user?.id)
    │
    ▼
Response: { ok: true, id, analysis: payload, mode, aiUsed }
```

---

## 7. Database Schema

```sql
-- Core analysis storage
analyses (
  id TEXT PRIMARY KEY,           -- UUID
  type TEXT NOT NULL,            -- text | url | image
  input_summary TEXT NOT NULL,   -- max 90 chars, never raw content
  risk_score INTEGER NOT NULL,   -- 0-100
  risk_level TEXT NOT NULL,      -- safe|low|suspicious|high|critical
  category TEXT NOT NULL,        -- threat category id
  analysis_json TEXT NOT NULL,   -- full AnalysisPayload JSON
  created_at TEXT NOT NULL,      -- ISO timestamp
  user_id TEXT                   -- NULL for anonymous
)

-- User accounts
users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,            -- scrypt(salt:hash); NULL for OAuth
  provider TEXT DEFAULT 'email', -- email | google | google-demo
  provider_id TEXT,
  avatar TEXT,
  email_verified INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)

-- OTP verification
otps (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,       -- scrypt-hashed 6-digit code
  expires_at TEXT NOT NULL,      -- ISO timestamp
  attempts INTEGER DEFAULT 0,   -- max OTP_MAX_ATTEMPTS
  verified INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
)

-- Staged signups (pending email verification)
pending_signups (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
)

-- Seeded demo scenarios (loaded once)
demo_scenarios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT NOT NULL
)
```

---

## 8. Frontend Architecture

### Routing (React Router v6)
```
/                   Landing page (public)
/analyze            Analysis workspace (public, optional auth)
/results/:id        Full threat report (public, reads from localStorage or API)
/dashboard          Analytics dashboard (protected)
/history            Analysis history (protected)
/learn              Education page (public)
/about              About page (public)
/privacy            Privacy policy (public)
/login              Sign in (public)
/signup             Sign up (public)
/auth/callback      OAuth callback handler (public)
```

### State Architecture
- **Auth:** React Context + JWT in `localStorage('scamshield:auth-token')`
- **Analysis cache:** `localStorage('scamshield:analysis-store')` — max 30 items
- **No global state library** — React state + localStorage (appropriate for this scale)
- **Navigation state:** Result passed via `react-router-dom` `location.state` on first load, then localStorage as fallback

### Code Splitting (Vite)
```javascript
// Manual chunks to keep initial load < 200 KB
'three'    // Three.js + @react-three/fiber
'charts'   // Recharts + d3 deps
'motion'   // framer-motion
'react'    // React + React-DOM
'vendor'   // everything else
```

---

## 9. Security Design

### Input Security
- All text inputs sanitized (control chars stripped, capped at 8000 chars)
- Image inputs validated as data URL, capped at 5.5 MB
- Type inputs whitelisted: `text | url | image | demo`
- JSON bodies limited to 6 MB via `express.json({ limit: '6mb' })`
- SQL queries parameterized throughout

### Authentication Security
- Passwords hashed with scrypt (work factor: 64 byte key)
- OTP codes hashed with scrypt before storage
- JWT: HMAC-SHA256, custom implementation (no dependency)
- Token expiry: 7 days
- Rate limits: auth (20/15min), OTP send (10/15min), OTP verify (30/15min)
- No raw passwords or OTPs in logs, error messages, or responses

### API Security
- CORS restricted to configured origins in production
- `x-powered-by` header removed
- Rate limiting on analysis endpoints (30/min text, 15/min images)
- Bearer token auth: optional on analysis, required on history mutation

### Secret Management
- All credentials in environment variables
- `.env` gitignored
- `.env.example` committed (no real values)
- API keys checked at runtime; service gracefully downgrades when absent

---

## 10. Reputation Intelligence Design

### Architecture (reputation.js)

```javascript
// checkReputation(url) → ReputationResult
{
  url: string,
  virusTotal: {
    status: ReputationStatus,
    positives?: number,    // only when status = verified_malicious
    total?: number,
    provider: 'virustotal',
  },
  safeBrowsing: {
    status: ReputationStatus,
    threatType?: string,
    provider: 'google_safe_browsing',
  },
  abuseIpdb: {
    status: ReputationStatus,
    abuseConfidenceScore?: number,
    provider: 'abuseipdb',
  },
  overallStatus: ReputationStatus,  // most severe of all providers
  checkedAt: string,               // ISO timestamp
}
```

### Provider Integration Details

**VirusTotal:**
- Endpoint: `POST /api/v3/urls` → get URL ID → `GET /api/v3/urls/{id}`
- Status mapping: `malicious > 3` → verified_malicious; `> 0` → suspicious; `= 0` → verified_safe
- Header: `x-apikey: ${VIRUSTOTAL_API_KEY}`
- Timeout: 15 seconds

**Google Safe Browsing:**
- Endpoint: `POST https://safebrowsing.googleapis.com/v4/threatMatches:find?key=...`
- Threat types: MALWARE, SOCIAL_ENGINEERING, UNWANTED_SOFTWARE, POTENTIALLY_HARMFUL_APPLICATION
- Status: matches found → verified_malicious (with threatType); no matches → verified_safe

**AbuseIPDB:**
- Only called for IP-address URLs
- Endpoint: `GET https://api.abuseipdb.com/api/v2/check?ipAddress=...&maxAgeInDays=90`
- Status: abuseConfidenceScore > 50 → verified_malicious; > 20 → suspicious; else → unknown

---

## 11. Deployment Architecture

### Platform Choice
- **Frontend:** Vercel (static site, auto-deploys from GitHub, free tier)
- **Backend:** Render (Node.js service, free tier, SQLite on ephemeral disk)

### Production Configuration
```
# Render environment variables
PORT=3001
JWT_SECRET=<long random string>
AI_API_KEY=<openai key>
AI_MODEL=gpt-4o-mini
CORS_ORIGIN=https://<your-vercel-app>.vercel.app
VIRUSTOTAL_API_KEY=<optional>
GOOGLE_SAFE_BROWSING_API_KEY=<optional>
ABUSEIPDB_API_KEY=<optional>

# Vercel environment variables
VITE_API_BASE=https://<your-render-app>.onrender.com
```

### Build Commands
```bash
# Backend (Render)
Build command: npm install
Start command: node server/index.js
Root directory: (project root)

# Frontend (Vercel)
Build command: npm --prefix client run build
Output directory: client/dist
Install command: npm --prefix client install
```

### CORS Configuration
```javascript
// Production CORS — exact origin matching
CORS_ORIGIN=https://scamshield-ai.vercel.app
// Development CORS
CORS_ORIGIN=http://localhost:5173
```

---

## 12. Error Handling Design

| Scenario | User-facing message | HTTP Status |
|----------|--------------------|----|
| Empty input | "Please paste some text to analyze — the input was empty." | 400 |
| Malformed URL | "That does not look like a valid web address." | 400 |
| Unsupported image type | "Please attach a valid PNG, JPG or WEBP image under 5 MB." | 400 |
| Image too large | "The uploaded content is too large." | 413 |
| AI API failure | AI explanation unavailable — deterministic analysis returned | 200 |
| AI validation failure | Same as AI API failure | 200 |
| External reputation timeout | Status: verification_unavailable | 200 |
| Rate limit exceeded | "Too many analysis requests. Please slow down." | 429 |
| Auth failure | "You need to sign in to continue." | 401 |
| Analysis not found | "This report is no longer available." | 404 |
| Database error | "Something went wrong on our side." (generic) | 500 |
| JSON parse error | "The request body could not be parsed." | 400 |

---

## 13. Demo Scenarios Design

Three key demo scenarios required for hackathon presentation:

### Scenario A — HIGH RISK (phishing)
Input: `"Your SBI account will be blocked within 24 hours unless you verify your identity. Login to update your KYC immediately: http://sbi-online-verify.xyz/confirm. Do not tell anyone."`

Expected signals: fear, authority, urgency, bypass, credential, suspicious URL  
Expected score: 75–92  
Expected category: impersonation  
Purpose: Shows multi-signal detection, evidence extraction, URL analysis

### Scenario B — LOW RISK (legitimate)
Input: `"Hi, this is your order confirmation from Amazon. Your package #12345 will arrive by Thursday. No action needed."`

Expected signals: possibly authority (Amazon mentioned)  
Expected score: 8–18  
Expected category: safe/unknown  
Purpose: Demonstrates false-positive protection — not everything is flagged

### Scenario C — UNKNOWN (ambiguous)
Input: `"Hi, can we talk?"`

Expected signals: none matched  
Expected score: 6–10  
Expected category: unknown  
Expected confidence: LOW  
Purpose: Shows that the system does not force a verdict on insufficient evidence

---

## 14. AnalysisPayload Type Definition

The complete TypeScript interface used by both frontend and backend:

```typescript
interface AnalysisPayload {
  id: string;
  type: 'text' | 'image' | 'url';
  inputSummary: string;           // max 90 chars, never raw sensitive content
  mode: 'demo' | 'ai';
  aiUsed: boolean;
  createdAt: string;              // ISO timestamp

  // Risk assessment
  riskScore: number;              // 0-100, deterministic
  riskLevel: RiskLevel;           // safe|low|suspicious|high|critical
  riskLabel: string;              // human-readable label
  category: CategoryInfo;         // id + label + icon + tone

  // Analysis outputs
  summary: string;                // 2-3 sentence explanation
  outcomeText: string;            // one-line verdict
  dimensions: Dimension[];        // 5 radar dimensions (0-100 each)
  reasons: ReasonItem[];          // numbered contributing signals
  manipulationTactics: Tactic[];  // social engineering techniques detected
  requestedInformation: RequestedInfo[];  // what attacker is after
  urlIndicators: UrlIndicator[];  // URL-specific structural findings
  reputationResults?: ReputationResult; // external API results (optional)

  // Actions
  recommendedActions: string[];   // safe defensive steps
  safeReply: string;              // safe response text
  attackChain: ChainNode[];       // escalation scenario steps

  // Confidence
  confidence: number;             // 0-100
  confidenceLabel: 'HIGH' | 'MODERATE' | 'LOW';

  // Evidence transparency
  evidenceBasis: {
    evidence: string[];           // literal observations from text
    inference: string[];          // patterns inferred
    uncertainty: string[];        // what cannot be determined
  };
  limitations: string[];          // explicit capability limitations
  disclaimers: string[];

  // Image analysis (optional)
  visualScan?: VisualScan;
}
```
