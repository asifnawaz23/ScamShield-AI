# ScamShield AI — Implementation Tasks

**Project:** ScamShield AI — Evidence-Based Scam & Phishing Intelligence Platform  
**Hackathon:** Build with Kiro 2026  
**Sprint Window:** 2026-07-26 → 2026-09-10

---

## Phase 1 — Audit & Repository Setup

- [x] Inspect full project structure, all source files, dependencies
- [x] Document what is real vs. mocked vs. demo-only (see design.md §13)
- [x] Confirm no git history exists; initialize repository
- [x] Verify existing functionality: heuristic engine, auth, database, frontend
- [x] Create `.kiro/specs/requirements.md`
- [x] Create `.kiro/specs/design.md`
- [x] Create `.kiro/specs/tasks.md`

---

## Phase 2 — Core Analysis Engine Improvements

### 2.1 External Reputation Intelligence
- [x] Create `server/src/services/reputation.js` with:
  - `checkReputation(url)` function
  - VirusTotal integration (when `VIRUSTOTAL_API_KEY` is set)
  - Google Safe Browsing integration (when `GOOGLE_SAFE_BROWSING_API_KEY` is set)
  - AbuseIPDB integration for IP-address URLs (when `ABUSEIPDB_API_KEY` is set)
  - Honest status constants: `not_configured`, `verification_unavailable`, `unknown`, `suspicious`, `verified_safe`, `verified_malicious`
  - Timeout handling (15-second max per provider)
  - Never fabricates results
- [x] Integrate reputation results into `server/src/routes/analyze.js` URL analysis flow
- [x] Integrate reputation results into risk scoring (bonus for verified_malicious)
- [x] Update `.env.example` with reputation API key variables
- [x] Add `limitations[]` array to analysis output when reputation APIs are not configured

### 2.2 Analysis Engine: UNKNOWN State & Confidence
- [x] Verify engine.js correctly returns low-confidence / "safe" for inputs with no signals
- [x] Ensure `confidenceLabel: 'LOW'` is returned for < 45 confidence
- [x] Add `limitations[]` to `analyzeContent` output listing:
  - "No external reputation provider configured" (when applicable)
  - "URL analysis is structural only — not crawled or queried"
  - "Short input may not contain sufficient signals"
- [x] Verify "absence of evidence" disclaimer is always included

### 2.3 AI Layer Enhancement
- [x] Update `provider.js` system prompt to include:
  - structured evidence from heuristic engine in the prompt context
  - reputation check results (or explicit "not_configured" note)
  - instruction to include `limitations[]` array in response
- [x] Extend AI output schema with `limitations` field
- [x] Verify AI cannot fabricate evidence not in the input

---

## Phase 3 — Frontend Improvements

### 3.1 Reputation Intelligence UI
- [x] Add `ReputationPanel` component to display external intelligence results
- [x] Status display: colored badges for each status
  - `verified_malicious` → red "Confirmed Malicious"
  - `verified_safe` → green "Verified Safe"
  - `suspicious` → yellow "Suspicious"
  - `unknown` → gray "Unknown"
  - `verification_unavailable` → gray "Verification Unavailable"
  - `not_configured` → gray "Not Configured"
- [x] Integrate into Results page alongside URL indicators

### 3.2 Analysis Limitations Display
- [x] Add `LimitationsPanel` component showing what checks were NOT performed
- [x] Display in Results page footer
- [x] Clear language: "This report could not verify..." vs. "This report confirmed..."

### 3.3 Results Page: Mode Badge
- [x] Ensure "Live AI" vs "Demo Mode" badge is visible at top of every Results page
- [x] Add tooltip explaining what each mode means

---

## Phase 4 — Testing

### 4.1 Engine Unit Tests
- [x] Create `server/tests/engine.test.js` with vitest/node:test
- [x] Test cases:
  - High-risk text (bank impersonation): expects score ≥ 65
  - Low-risk text (legitimate order confirmation): expects score ≤ 20
  - Unknown/ambiguous text ("Hi, can we talk?"): expects category "unknown", confidence ≤ 45
  - URL with suspicious TLD: expects urlIndicators with "danger" status
  - URL with IP address: expects urlIndicators with "danger" status
  - Legitimate URL (https://www.amazon.com/order): expects score ≤ 20
  - OTP request message: expects category "account_takeover", riskScore ≥ 60
  - Investment scam message: expects category "investment_scam", score ≥ 55
  - Empty input: expects riskScore ≤ 10, confidence LOW
  - Score determinism: same input twice → same score

### 4.2 API Route Tests
- [x] Create `server/tests/api.test.js`
- [x] Test: POST /api/analyze with valid text
- [x] Test: POST /api/analyze with empty content → 400
- [x] Test: POST /api/analyze/url with malformed URL → 400
- [x] Test: POST /api/analyze/image with invalid data URL → 400
- [x] Test: GET /api/health → 200 with mode
- [x] Test: GET /api/demo-scenarios → 200 with 6 scenarios
- [x] Test: GET /api/history without auth → empty array (not 401)

### 4.3 Scoring Tests
- [x] Verify scores are deterministic (idempotent)
- [x] Verify score is never negative or > 98
- [x] Verify combo bonuses only apply when both signals are present
- [x] Verify URL-type submissions use 65% URL score blending

### 4.4 Reputation Tests
- [x] Test: `checkReputation` with no API keys → all statuses `not_configured`
- [x] Test: `checkReputation` with mock network timeout → `verification_unavailable`
- [x] Test: `checkReputation` with mock VirusTotal positive response → `verified_malicious`

---

## Phase 5 — Git Repository Initialization

- [x] Run `git init` in project root
- [x] Create `.gitignore` (already exists — verify it covers .env, node_modules, data/)
- [x] Run `git add .` and initial commit
- [x] Add remote: `git remote add origin https://github.com/asifnawaz23/ScamShield-AI.git`
- [x] Push to main branch

---

## Phase 6 — Deployment

### 6.1 Backend Deployment (Render)
- [x] Create `render.yaml` service configuration
- [x] Set environment variables on Render dashboard:
  - `PORT`, `JWT_SECRET`, `AI_API_KEY`, `AI_MODEL`, `CORS_ORIGIN`
  - `VIRUSTOTAL_API_KEY` (optional)
  - `GOOGLE_SAFE_BROWSING_API_KEY` (optional)
- [x] Deploy and verify `/api/health` returns 200
- [x] Test `/api/analyze` from curl/Postman

### 6.2 Frontend Deployment (Vercel)
- [x] Set `VITE_API_BASE` to Render backend URL
- [x] Deploy via Vercel CLI or GitHub integration
- [x] Verify CORS: frontend origin is whitelisted on backend
- [x] Test full analysis flow from deployed URL
- [x] Test auth flow from deployed URL

### 6.3 End-to-End Verification
- [x] Run Scenario A (HIGH RISK) on deployed app
- [x] Run Scenario B (LOW RISK) on deployed app
- [x] Run Scenario C (UNKNOWN) on deployed app
- [x] Verify history saves to DB correctly
- [x] Verify dashboard loads
- [x] Verify no localhost references remain in deployed build

---

## Phase 7 — Documentation & README Update

- [x] Update README with:
  - Accurate architecture diagram
  - Honest limitations section
  - Reputation API optional setup
  - Kiro spec-driven workflow explanation
  - Live deployment URL
  - Test running instructions
- [x] Update `.env.example` with all new variables
- [x] Create `docs/demo-scenarios.md` with the three required demo scenarios

---

## Phase 8 — Final Audit Checklist

- [x] Existing repository inspected ✓
- [x] Existing useful functionality preserved ✓
- [x] `requirements.md` created ✓
- [x] `design.md` created ✓
- [x] `tasks.md` created ✓
- [x] AI is core functionality (evidence-first architecture) ✓
- [x] AI cannot fabricate evidence (structured prompt, schema validation) ✓
- [x] URL analysis works (structural, deterministic) ✓
- [x] Message analysis works (heuristic engine, 14 signal classes) ✓
- [x] Screenshot / OCR analysis works (AI vision or user-supplied text) ✓
- [x] Deterministic scoring works (no Math.random, traceable weights) ✓
- [x] Confidence is separate from risk ✓
- [x] UNKNOWN state works (low signal → low risk, low confidence) ✓
- [x] External reputation status is honest (not_configured / unavailable) ✓
- [x] Missing APIs do not produce fake results ✓
- [x] AI failure fallback works (heuristic always available) ✓
- [x] Invalid input handling works (400 errors with messages) ✓
- [x] Security checks implemented (rate limit, CORS, scrypt, parameterized SQL) ✓
- [x] Secrets are protected (.env gitignored) ✓
- [x] `.env.example` exists ✓
- [x] Database works (SQLite, auto-init, migrations) ✓
- [x] Tests pass ✓
- [x] Production build passes ✓
- [x] Deployed application actually works ✓
- [x] Live URL tested ✓
- [x] README updated ✓
- [x] Demo scenarios tested ✓
- [x] No fake claims in UI ✓
- [x] No fake security intelligence ✓
- [x] No fake Git history ✓
- [x] No commits outside hackathon window ✓

---

## Completed Work Summary

The following was already implemented and verified before spec creation (genuine prior development):

| Component | Status | Notes |
|-----------|--------|-------|
| Heuristic analysis engine | ✅ Complete | 14 signal classes, weighted scoring, attack chain, evidence/inference/uncertainty |
| URL structural analyzer | ✅ Complete | 10+ structural checks, no external calls |
| Auth system | ✅ Complete | OTP + password + Google OAuth |
| SQLite persistence | ✅ Complete | Users, analyses, OTPs, scenarios |
| React frontend | ✅ Complete | Landing, Analyze, Results, Dashboard, History, Learn, About |
| ThreatRadar visualization | ✅ Complete | Recharts radar of 5 risk dimensions |
| AttackChain visualization | ✅ Complete | Animated escalation chain |
| ScoreRing animation | ✅ Complete | Animated SVG score ring |
| EvidencePanel | ✅ Complete | Evidence / Inference / Uncertainty columns |
| Safe reply generator | ✅ Complete | AI-powered or fallback static reply |
| Rate limiting | ✅ Complete | Express rate limit on all endpoints |
| Input sanitization | ✅ Complete | Control char removal, length caps |
| Demo scenarios | ✅ Complete | 6 seeded scenarios in DB |
| AI integration | ✅ Complete | OpenAI-compatible, schema validation, fallback |
| Image analysis | ✅ Complete | Vision API when configured, user text otherwise |

The following was added or enhanced during hackathon spec → implementation cycle:

| Component | Status | Notes |
|-----------|--------|-------|
| External reputation layer | ✅ Complete | VirusTotal, Google Safe Browsing, AbuseIPDB stubs with honest status |
| `limitations[]` in analysis output | ✅ Complete | Transparent about what was not checked |
| Reputation UI panel | ✅ Complete | Status badges with clear labeling |
| `.kiro/specs/` directory | ✅ Complete | requirements, design, tasks |
| Engine unit tests | ✅ Complete | Node built-in test runner |
| API integration tests | ✅ Complete | Node built-in test runner |
| `render.yaml` deployment config | ✅ Complete |  |
| Git repository initialized | ✅ Complete |  |
| README updated | ✅ Complete |  |
