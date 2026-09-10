# 01 — Project Description

## ScamShield AI

**Tagline:** See the scam before it sees you.
**Subtagline:** AI-powered scam intelligence for everyone.

### One-line pitch
ScamShield AI is an explainable AI security assistant that helps everyday users understand suspicious digital
messages, screenshots, and links before they act on them.

### What it does
Given any suspicious input — a WhatsApp/SMS screenshot, email, pasted message, job offer, payment request, fake prize
message, or URL — ScamShield produces a complete, understandable threat report:

- Overall risk score (0–100) and threat classification
- Suspicious signals with literal evidence from the message
- Risk dimensions (Social Engineering, Link Risk, Urgency, Credential Risk, Financial Risk)
- Manipulation tactics (urgency, authority lure, fear, reward bait, scarcity, channel-jumping…)
- URL risk indicators (structural inspection only — never opens the link)
- Requested-information analysis (credentials, OTPs, payments, personal data)
- Recommended actions and a safe-reply generator
- "What could happen next?" attack-chain visualization (defensive simulation)
- Confidence level, with evidence → inference → uncertainty kept strictly separate

### The differentiator
Not another spam filter. **Explainable threat intelligence for ordinary users.** Every score comes with *why*,
every assessment is framed as likelihood, and the product is transparent about what it cannot know.

### Demo mode
The app ships with a deterministic threat-intelligence engine, so the entire experience works offline and
in front of a live judge — with **Demo Mode** clearly labeled. When `AI_API_KEY` is configured, a live
OpenAI-compatible model produces the analysis with strict JSON validation and safe fallback.