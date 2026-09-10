# ScamShield AI — Demo Scenarios

These three scenarios are designed to demonstrate the full range of the detection system
for the hackathon presentation. Each produces a **deterministic, reproducible result** from
the heuristic engine — no randomness, no AI hallucination.

---

## Scenario A — HIGH RISK: Bank Impersonation + Phishing Link

**Input (paste into the "Paste text" tab):**

```
Your SBI account will be blocked within 24 hours unless you verify your identity.
Login to update your KYC immediately: http://sbi-online-verify.xyz/confirm
Do not tell anyone about this message. Your account will be permanently blocked otherwise.
```

**What to show the judge:**
- Risk score: **75–92 / 100** (HIGH or CRITICAL)
- Category: **Impersonation** or **Phishing**
- Signals detected: fear, authority, urgency, bypass-normal-channels, suspicious URL
- URL indicators: suspicious TLD (`.xyz`), brand-style domain token (`sbi`)
- Evidence panel: literal quotes from the message under "Evidence"
- Attack chain: shows impersonation → urgency → credential request → account takeover
- Limitations panel: shows "URL analysis is structural only" (honest about what was NOT done)

**Key talking point:** Every signal is traceable to a phrase in the original message.
The system does not invent threat intelligence.

---

## Scenario B — LOW RISK: Legitimate Order Confirmation

**Input (paste into the "Paste text" tab):**

```
Hi there, your Amazon order #112-3456789-0123456 has been confirmed.
Your package containing "Wireless Headphones" will be delivered by Thursday.
You can track your order at amazon.com/orders. No action is required.
```

**What to show the judge:**
- Risk score: **8–20 / 100** (LIKELY SAFE or LOW RISK)
- Category: **Safe** or **Unknown**
- Signals: possibly `authority` (Amazon mentioned) — but no credential request, no urgency, no payment, no suspicious URL
- The outcome banner shows: "NO STRONG THREAT PATTERNS DETECTED — STAY CAUTIOUS"
- Uncertainty section notes: "Absence of detected signals is not proof that a message is genuine"

**Key talking point:** The system does **not** flag everything. A single brand mention
alone does not trigger a high risk score. False-positive protection is a core design goal.

---

## Scenario C — UNKNOWN: Ambiguous / Insufficient Evidence

**Input (paste into the "Paste text" tab):**

```
Hi, can we talk? I have something important to share with you.
```

**What to show the judge:**
- Risk score: **6–12 / 100**
- Category: **Unknown**
- Confidence label: **LOW**
- No signals detected
- Evidence panel: "No high-confidence marker phrases were matched in the supplied content."
- Outcome: "NO STRONG THREAT PATTERNS DETECTED — STAY CAUTIOUS"

**Key talking point:** The system does not force a verdict. When evidence is insufficient,
it returns an honest **UNKNOWN / LOW CONFIDENCE** result instead of guessing.
This is one of the key differentiators from generic AI chatbots that always produce
a confident-sounding answer.

---

## Scenario D — URL Analysis: Phishing Link

**Input (paste into the "Analyze URL" tab):**

```
http://login-paypal-secure-verify.account-update.xyz/confirm?token=abc123
```

**What to show the judge:**
- Type: URL analysis
- Risk score: **60–85 / 100** (HIGH)
- URL indicators:
  - ⚠ Suspicious TLD (`.xyz`)
  - 🔴 Brand-style domain token (`login`, `paypal`, `secure`, `verify`)
  - ⚠ Action-oriented path (`confirm`)
  - ⚠ Excessive subdomains
- Category: **Phishing**
- Reputation panel: shows "Not Configured" for each provider (honest about no API keys)
- Limitations: "URL analysis inspects link structure only — URL was not opened or crawled"

**Key talking point:** Even without external reputation APIs, the structural analysis
correctly identifies multiple phishing-style patterns. When APIs are configured, real
VirusTotal / Google Safe Browsing results appear here.

---

## Using the Built-in Demo Scenarios

The application ships with 6 pre-loaded scenarios accessible via the
**"Demo scenarios"** tab on the Analyze page:

| Scenario | Expected Category | Expected Score |
|----------|------------------|----------------|
| Fake Prize | fake_prize | 70–90 |
| Fake Job Offer | job_scam | 60–80 |
| Bank Impersonation | impersonation | 75–92 |
| Delivery Scam | delivery_scam | 55–75 |
| Investment Scam | investment_scam | 65–85 |
| Account Verification / OTP | account_takeover | 70–90 |

These scenarios run the **exact same analysis pipeline** as user-submitted text.
They are documented test inputs, not pre-computed results.

---

## Kiro Workflow Demo (for the required 2:20–3:00 section)

Open the `.kiro/specs/` directory and briefly show:

1. **`requirements.md`** — 14 user stories, each with numbered acceptance criteria
2. **`design.md`** — full architecture, scoring design, AI architecture, data flow
3. **`tasks.md`** — implementation tasks with `[x]` for completed and `[ ]` for future work

Emphasize: these documents represent the **genuine spec-driven development process**
used with Kiro throughout the hackathon, not retroactive documentation.
