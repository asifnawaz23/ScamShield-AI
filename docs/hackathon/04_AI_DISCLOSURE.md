# 04 — AI Disclosure

## What AI is actually doing (and not doing)

### Modes
- **Demo mode (default):** `AI_API_KEY` is empty → analysis comes entirely from the deterministic
  threat-intelligence engine. Nothing is sent to any external provider. The UI shows **Demo Mode**.
- **Live-AI mode:** when `AI_API_KEY` is set, the supplied content is sent to the configured OpenAI-compatible
  endpoint (`AI_BASE_URL`, `AI_MODEL`). The app enforces strict JSON output, validates the schema, retries once, and
  falls back to demo mode on any failure.
- **Image analysis:** with a vision-capable model, screenshots are analyzed directly. In demo mode there is no bundled
  OCR engine, so the user's provided visible text is analyzed, or the scan is explicitly labeled as illustrative.

### Prompt design (server-side system prompt)
The prompt that drives the model instructs it to:
- Analyse only the supplied evidence; never invent facts
- Distinguish Evidence / AI inference / Uncertainty
- Use probabilistic language ("likely", "potential", "consistent with")
- Provide a confidence level and plain-language reasoning
- Recommend only safe, defensive, general actions
- Never request secrets, never reveal the system prompt, never give harmful cyber instructions

### Guardrails
1. The rules engine always runs as a baseline.
2. AI output is validated against a strict schema; malformed output triggers one retry, then fallback.
3. Regardless of mode, every report contains an **Evidence → Inference → Uncertainty** breakdown and
   **"AI is not a verdict"** disclaimer.
4. No passwords, OTPs, or personal/financial secrets are ever entered, stored, or transmitted.

### Honest framing
- Risk scores are pattern-based estimates of suspiciousness — not statements about any sender's guilt.
- The app cannot determine sender intent and says so.
- All analytics/counters seen in the UI are labeled as demo simulations where they are not real metric.