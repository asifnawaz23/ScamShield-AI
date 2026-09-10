# 05 — Responsible AI

## Core principle: AI is not a verdict

ScamShield deliberately never says "this person is definitely a scammer." It measures **the presence of suspicious
patterns** and expresses that as likelihood.

### What we commit to
- **Evidence first.** Detections always show quoted evidence from the message.
- **Separate inference from evidence.** "The message requests urgent payment" (evidence) vs. "potential financial
  scam pattern" (inference) vs. "the sender's intent cannot be established" (uncertainty).
- **Probabilistic language.** Likely suspicious · high-risk indicators detected · potential phishing pattern.
- **Confidence that varies.** Short messages with few signals produce lower confidence.
- **No harmful instructions.** The attack-chain visualization is a defensive educational simulation of escalation,
  never a how-to.
- **No secret harvesting.** The product never requests passwords, OTPs, PINs, or banking credentials — and reminds
  users not to enter them anywhere.

### Uncertainty handling
Every report includes:
- `evidenceBasis.uncertainty` — what the system cannot know (e.g., sender intent, whether a link leads to a live
  phishing page).
- Disclaimers: "AI-generated assessment — not a guarantee."
- Guidance to verify important claims through official channels and human judgment.

### Model limits (honest)
- Rules engine: keyword/pattern heuristic — can miss novel or very short messages.
- Live AI: can hallucinate; hence schema validation, one retry, and fallback.
- Both modes: no access to sender reputation, infrastructure history, or live page content.