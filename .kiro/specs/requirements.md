# ScamShield AI — Requirements

**Project:** ScamShield AI — Evidence-Based Scam & Phishing Intelligence Platform  
**Hackathon:** Build with Kiro 2026  
**Author:** Muhammad Asif Nawaz  
**Date:** 2026-07-26 → 2026-09-10

---

## 1. Problem Statement

Millions of people receive fraudulent messages every day — phishing SMS, fake prize notifications, impersonation emails, delivery scam links, OTP-harvesting texts, and investment fraud. Existing spam filters produce a binary "likely spam" verdict without explaining why, leaving users unable to learn from the experience or make informed decisions. People who don't understand the manipulation tactics used against them are more likely to fall for the next variant.

---

## 2. Solution Vision

ScamShield AI provides evidence-based, explainable threat intelligence for suspicious digital messages. It combines:

1. **Deterministic signal extraction** — regex-matched, weighted indicators from the message content
2. **Structural URL analysis** — local, safe inspection of link anatomy (never crawls or opens URLs)
3. **Layered risk scoring** — all scores traceable to contributing signals
4. **AI-powered reasoning** — LLM generates explanation over structured evidence, not free-form verdicts
5. **Confidence-separated output** — risk and confidence are distinct; unknown is a valid result
6. **Actionable guidance** — safe reply, recommended actions, attack-chain visualization

---

## 3. User Stories

### US-01: Text Message Analysis
**As a** user who received a suspicious SMS or email,  
**I want to** paste the text and receive a structured threat report,  
**So that** I can understand whether it is safe to act on before sharing credentials or money.

**Acceptance Criteria:**
- AC-01a: System accepts text input of 1–8000 characters
- AC-01b: System rejects empty input with a human-readable error
- AC-01c: System extracts all matching signal categories and quotes evidence phrases
- AC-01d: System calculates a deterministic risk score (0–100) traceable to signals
- AC-01e: System classifies into one of 11 threat categories
- AC-01f: System produces a confidence score (0–100) separate from risk score
- AC-01g: System returns "UNKNOWN / Insufficient evidence" when no strong signals are found
- AC-01h: System never invents evidence not present in the input text
- AC-01i: System completes analysis in under 3 seconds in demo mode

### US-02: URL Analysis
**As a** user who received a suspicious link,  
**I want to** submit the URL for structural analysis,  
**So that** I can understand the risk level before clicking it.

**Acceptance Criteria:**
- AC-02a: System accepts valid http/https URLs
- AC-02b: System rejects malformed URLs with a clear error message
- AC-02c: System analyzes protocol, hostname, subdomain count, path, TLD, IP-address format, URL shorteners, suspicious keywords
- AC-02d: System returns URL-specific risk indicators with status (safe/warning/danger)
- AC-02e: System never opens, crawls, or downloads content from the submitted URL
- AC-02f: System never claims a URL is malicious/safe based on external reputation unless an external API was actually queried and returned a result
- AC-02g: System labels all URL analysis as "structural analysis only" when no external reputation check was performed
- AC-02h: A structurally clean HTTPS URL with a known brand domain scores ≤ 15 (false-positive protection)

### US-03: Screenshot Analysis
**As a** user who received a suspicious message as a screenshot,  
**I want to** upload the image and receive a threat assessment,  
**So that** I don't need to retype the message manually.

**Acceptance Criteria:**
- AC-03a: System accepts PNG, JPG, WEBP images up to 5 MB
- AC-03b: System rejects unsupported file types with a human-readable error
- AC-03c: When a vision-capable AI model is configured, the system uses it to extract message content from the image
- AC-03d: When no AI model is configured, the system analyzes user-supplied visible text if provided
- AC-03e: When no AI and no visible text, system returns a labeled "illustrative scan" result and clearly explains OCR is unavailable
- AC-03f: System never fabricates the content of an image
- AC-03g: System labels the analysis source: AI vision scan / user-supplied text / illustrative demo

### US-04: Evidence-Based Scoring
**As a** user reviewing the report,  
**I want to** see exactly which signals contributed to the risk score and by how much,  
**So that** I can assess the reasoning rather than blindly trusting a number.

**Acceptance Criteria:**
- AC-04a: Every risk score displays a ranked list of contributing signals
- AC-04b: Each signal shows: title, severity contribution (HIGH/MEDIUM/LOW), explanation, evidence quote from original text
- AC-04c: Score calculation uses documented, deterministic weights — no random numbers
- AC-04d: Two identical inputs always produce identical scores
- AC-04e: Score is bounded 0–100; scores above 98 are not possible from the engine

### US-05: UNKNOWN / Insufficient Evidence State
**As a** user who submitted a short or ambiguous message,  
**I want to** see an honest "Unknown" result rather than a forced verdict,  
**So that** I am not misled by a confident-looking but unsupported assessment.

**Acceptance Criteria:**
- AC-05a: Messages with no matched signals and score < 20 produce riskLevel "safe" with a note that no strong threat patterns were detected
- AC-05b: The report always states: "Absence of detected signals is not proof that a message is genuine"
- AC-05c: Low-confidence results (confidence < 45) are labeled "LOW confidence"
- AC-05d: The system never fabricates additional signals to raise a score for visual impact
- AC-05e: Demo scenarios clearly reproduce their expected risk levels deterministically

### US-06: AI Explanation Over Evidence
**As a** user who wants deeper context,  
**I want** the AI to explain the findings in plain language,  
**So that** I can understand the threat pattern, not just a number.

**Acceptance Criteria:**
- AC-06a: When an AI API key is configured, the system sends structured evidence (not raw free-form text) to the model
- AC-06b: The AI prompt includes: extracted signals, URL analysis results, all detected indicators
- AC-06c: AI output is validated against a strict JSON schema before use
- AC-06d: If AI validation fails twice, the system falls back to the deterministic engine
- AC-06e: The report always labels the result: "Live AI" or "Demo Mode"
- AC-06f: AI explanation is displayed alongside (not instead of) the deterministic evidence
- AC-06g: If AI is unavailable, the report shows "AI explanation unavailable — deterministic analysis completed"

### US-07: External Reputation Intelligence (Optional)
**As a** security-aware user,  
**I want** the system to query known threat intelligence databases when configured,  
**So that** I get confirmed reputation data in addition to structural analysis.

**Acceptance Criteria:**
- AC-07a: When `VIRUSTOTAL_API_KEY` is set, the system submits URLs for VirusTotal analysis
- AC-07b: When `GOOGLE_SAFE_BROWSING_API_KEY` is set, the system queries the Safe Browsing API
- AC-07c: When `ABUSEIPDB_API_KEY` is set, IP-address URLs are checked against AbuseIPDB
- AC-07d: When no API key is configured, the status is "not_configured" — never "safe" or "malicious"
- AC-07e: API timeout or error results in status "verification_unavailable" — never fabricated
- AC-07f: The UI clearly displays: Verified malicious / Verified safe / Suspicious / Unknown / Verification unavailable / Not configured

### US-08: Safe Reply Generator
**As a** user who wants to respond to a potential scammer without giving information away,  
**I want** a pre-written safe response,  
**So that** I can deflect without appearing rude or revealing credentials.

**Acceptance Criteria:**
- AC-08a: System generates a polite, firm reply that shares no passwords, OTPs, PINs, or financial details
- AC-08b: Reply does not encourage continued interaction with the scammer
- AC-08c: User can copy the reply to clipboard
- AC-08d: Fallback reply is available even when AI is not configured

### US-09: Attack Chain Visualization
**As a** user reading the report,  
**I want to** see a visual explanation of how the attack typically escalates,  
**So that** I understand the full risk trajectory, not just the immediate message.

**Acceptance Criteria:**
- AC-09a: Attack chain steps are derived from the detected threat category
- AC-09b: Only steps supported by detected evidence are shown
- AC-09c: Chain is labeled: "Typical escalation — not a prediction that it will happen"
- AC-09d: Each node shows a label and expandable description

### US-10: Analysis History & Dashboard
**As a** signed-in user,  
**I want to** view my past analyses in a dashboard,  
**So that** I can track patterns and revisit reports.

**Acceptance Criteria:**
- AC-10a: Analyses are stored per user (requires sign-in)
- AC-10b: Raw message text is never stored — only a 90-character summary
- AC-10c: Dashboard shows total analyses, high-risk count, average score, most common category
- AC-10d: Charts show category distribution, risk distribution, 7-day timeline
- AC-10e: Demo analytics ("Platform demo analytics") are clearly labeled as illustrative simulation data, not real metrics
- AC-10f: User can delete individual analyses or clear all history

### US-11: Authentication
**As a** user,  
**I want to** create an account with email/password or OTP,  
**So that** my history persists across sessions.

**Acceptance Criteria:**
- AC-11a: Email + password signup with scrypt hashing
- AC-11b: 6-digit OTP passwordless login via verified email delivery
- AC-11c: Optional Google OAuth when credentials are configured
- AC-11d: JWT sessions with 7-day expiry
- AC-11e: Rate limiting on all auth endpoints
- AC-11f: Passwords are never logged or returned in API responses
- AC-11g: Analysis is available without an account (anonymous mode)

### US-12: Security & Privacy
**As a** user,  
**I want** the platform to protect my data,  
**So that** my sensitive message content is not stored or exposed.

**Acceptance Criteria:**
- AC-12a: Raw messages are never persisted — only 90-character summary and generated report
- AC-12b: API keys are environment-variable only — never in code or responses
- AC-12c: All inputs are sanitized (control characters stripped, max 8000 chars)
- AC-12d: CORS is restricted to configured origins in production
- AC-12e: Rate limiting applies to analysis and auth endpoints
- AC-12f: Passwords and OTP codes are never logged
- AC-12g: No SQL injection possible — parameterized queries throughout

### US-13: Demo Mode Transparency
**As a** user in demo mode,  
**I want** to clearly see when I'm viewing a demo vs. live analysis,  
**So that** I understand the limitations of the current environment.

**Acceptance Criteria:**
- AC-13a: Every analysis result is labeled "Live AI" or "Demo Mode"
- AC-13b: Demo scenarios are documented as fixed test inputs, not live threat intelligence
- AC-13c: Image analysis without OCR is labeled "Illustrative demo scan"
- AC-13d: The health endpoint reports current mode: `"mode": "ai"` or `"mode": "demo"`

### US-14: Deployment
**As a** user,  
**I want to** access ScamShield from a public URL,  
**So that** I don't need to set up a local development environment.

**Acceptance Criteria:**
- AC-14a: Frontend is publicly accessible over HTTPS
- AC-14b: Backend API is publicly accessible
- AC-14c: All API calls work from the deployed frontend
- AC-14d: CORS is correctly configured for the deployed domains
- AC-14e: Production environment variables are configured on the hosting platform
- AC-14f: No localhost dependencies remain in the deployed build

---

## 4. Non-Functional Requirements

| ID | Requirement |
|----|------------|
| NFR-01 | Demo mode analysis completes in < 3 seconds |
| NFR-02 | Live AI analysis completes in < 25 seconds (includes AI API call) |
| NFR-03 | Frontend build is < 2 MB gzipped (code splitting in place) |
| NFR-04 | Application is accessible on mobile viewports (min 375px) |
| NFR-05 | Application meets basic WCAG 2.1 AA accessibility (aria labels, focus management, color contrast) |
| NFR-06 | API payload limit is 6 MB (image upload support) |
| NFR-07 | No external API call is made for URL analysis unless a reputation API key is configured |
| NFR-08 | All secret values are environment-variable only; `.env` is gitignored |
| NFR-09 | SQLite database is created automatically on first run |
| NFR-10 | Application runs on Node.js ≥ 22.5 (requires built-in `node:sqlite`) |

---

## 5. Out of Scope (This Release)

- Browser extension
- WhatsApp integration
- Bundled OCR (tesseract.js) in demo mode
- Community threat-report database
- On-device ML classifiers (WebGPU/ONNX)
- Multi-language support (beyond English-dominant patterns)
- Password reset flow
- Refresh token rotation
