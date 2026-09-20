/**
 * ScamShield AI — Evidence-First AI Layer
 *
 * ARCHITECTURE (the fundamental rule):
 *   Heuristic engine ALWAYS runs first and produces structured evidence.
 *   The AI receives that structured evidence and explains/enhances it.
 *   The AI NEVER invents evidence — it receives facts and interprets them.
 *
 * Pipeline:
 *   1. analyzeContent() → heuristic result with all signals, scores, evidence quotes
 *   2. buildEvidenceContext(heuristic) → structured evidence summary for the AI
 *   3. callLLM(systemPrompt, evidenceContext) → AI explanation over real evidence
 *   4. mergeHeuristicWithAI(heuristic, aiResult) → combine best of both
 *   5. Return merged result
 *
 * Fallback: if AI is unavailable/invalid, heuristic result is returned as-is.
 */

import { analyzeContent } from '../services/engine.js';

const BASE_URL = process.env.AI_BASE_URL || 'https://api.openai.com/v1';

// ─────────────────────────────────────────────────────────────────────────────
// Build structured evidence context to inject into the AI prompt
// This is the KEY change: AI receives pre-computed evidence, not raw text
// ─────────────────────────────────────────────────────────────────────────────

function buildEvidenceContext(heuristic, rawContent, type) {
  const lines = [];

  lines.push(`=== HEURISTIC ENGINE REPORT ===`);
  lines.push(`Input type: ${type}`);
  lines.push(`Heuristic risk score: ${heuristic.riskScore}/100`);
  lines.push(`Risk level: ${heuristic.riskLevel.toUpperCase()}`);
  lines.push(`Confidence: ${heuristic.confidence}/100 (${heuristic.confidenceLabel})`);
  lines.push(`Detected category: ${heuristic.category.label}`);
  lines.push('');

  // Detected signals with evidence quotes
  if (heuristic.reasons && heuristic.reasons.length > 0) {
    lines.push(`=== DETECTED SIGNALS (${heuristic.reasons.length}) ===`);
    for (const r of heuristic.reasons) {
      lines.push(`[${r.contribution}] ${r.title}`);
      if (r.evidence) lines.push(`  Evidence: "${r.evidence}"`);
      lines.push(`  Explanation: ${r.explanation}`);
    }
    lines.push('');
  } else {
    lines.push('=== DETECTED SIGNALS ===');
    lines.push('No high-confidence signal patterns were matched.');
    lines.push('');
  }

  // URL indicators
  if (heuristic.urlIndicators && heuristic.urlIndicators.length > 0) {
    lines.push('=== URL ANALYSIS ===');
    for (const ind of heuristic.urlIndicators) {
      lines.push(`[${ind.status.toUpperCase()}] ${ind.label}: ${ind.detail}`);
      if (ind.url) lines.push(`  URL: ${ind.url}`);
    }
    lines.push('');
  }

  // Manipulation tactics detected
  if (heuristic.manipulationTactics && heuristic.manipulationTactics.length > 0) {
    lines.push('=== MANIPULATION TACTICS DETECTED ===');
    for (const t of heuristic.manipulationTactics) {
      lines.push(`- ${t.name}: ${t.blurb}`);
    }
    lines.push('');
  }

  // Requested information
  if (heuristic.requestedInformation && heuristic.requestedInformation.length > 0) {
    lines.push('=== SENSITIVE INFORMATION REQUESTED ===');
    for (const r of heuristic.requestedInformation) {
      lines.push(`- ${r.kind} (Sensitivity: ${r.sensitivity})`);
    }
    lines.push('');
  }

  // Evidence basis from heuristic
  lines.push('=== EVIDENCE BASIS ===');
  lines.push('Evidence (literal):');
  for (const e of (heuristic.evidenceBasis?.evidence || [])) {
    lines.push(`  • ${e}`);
  }
  lines.push('Inference (patterns):');
  for (const i of (heuristic.evidenceBasis?.inference || [])) {
    lines.push(`  • ${i}`);
  }
  lines.push('');

  // Raw content for AI to read directly
  lines.push('=== ORIGINAL MESSAGE/INPUT ===');
  lines.push(`"""`);
  lines.push(String(rawContent).slice(0, 3000));
  lines.push(`"""`);

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt — AI is an explainer, NOT a detector
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt() {
  return `You are ScamShield AI, an explainable threat intelligence assistant.

CRITICAL ROLE: You are an EXPLAINER and REASONER over pre-computed evidence.
You are NOT a detector. The heuristic engine has already detected signals.
Your job is to explain WHY they matter, confirm the category, and give actionable guidance.

INPUT FORMAT:
You will receive a structured report from the heuristic engine containing:
- Pre-computed risk score and level
- All detected signal phrases (literal quotes from the message)
- URL structural analysis results
- Manipulation tactics already identified
- The original message text

YOUR HARD RULES:
1. ONLY explain and expand on the evidence already provided. NEVER invent new signals.
2. If the heuristic found 0 signals, you MUST reflect that — do not manufacture risk.
3. Your riskScore MUST stay within ±15 of the heuristic score. Do not wildly override it.
4. Use probabilistic language: "likely", "consistent with", "high-risk pattern detected".
5. Clearly distinguish: EVIDENCE (what the message says) vs INFERENCE (what it suggests) vs UNCERTAINTY.
6. Never accuse the sender. Never make definitive verdicts. Never provide attack instructions.
7. safeReply must NOT share passwords, OTPs, PINs, CVVs, or any financial details.
8. Your output is STRICT JSON only. No markdown. No text outside the JSON object.

Output EXACTLY this JSON schema:
{
  "riskScore": <integer, must be within ±15 of heuristic score>,
  "riskLevel": "safe" | "low" | "suspicious" | "high" | "critical",
  "category": "phishing" | "fake_prize" | "job_scam" | "investment_scam" | "payment_scam" | "impersonation" | "account_takeover" | "delivery_scam" | "romance" | "tech_support" | "unknown",
  "summary": "<2-3 sentence explanation referencing the actual detected signals>",
  "confidence": <integer 0-100>,
  "reasons": [
    {
      "title": "<signal name>",
      "contribution": "HIGH" | "MEDIUM" | "LOW",
      "explanation": "<why this signal is dangerous in this context>",
      "evidence": "<exact quote from the message or 'URL structure' if URL-based>"
    }
  ],
  "manipulationTactics": [{"name": "<tactic>", "blurb": "<how it works in this message>"}],
  "requestedInformation": [{"kind": "<what is being requested>", "sensitivity": "CRITICAL" | "HIGH" | "MEDIUM"}],
  "recommendedActions": ["<specific actionable step>"],
  "safeReply": "<a firm, polite reply that shares absolutely no sensitive information>",
  "evidenceBasis": {
    "evidence": ["<literal phrases or facts from the message>"],
    "inference": ["<patterns these facts suggest>"],
    "uncertainty": ["<what cannot be determined from this message alone>"]
  },
  "scamCategory": "<1-2 sentence explanation of this scam type and how it works>",
  "redFlags": ["<specific red flag as a short phrase>"]
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation — AI output must match schema AND respect heuristic score
// ─────────────────────────────────────────────────────────────────────────────

function validateAiPayload(json, heuristicScore) {
  const ok =
    json &&
    typeof json === 'object' &&
    typeof json.riskScore === 'number' &&
    Number.isFinite(json.riskScore) &&
    typeof json.riskLevel === 'string' &&
    typeof json.category === 'string' &&
    typeof json.summary === 'string' &&
    typeof json.confidence === 'number' &&
    Array.isArray(json.reasons) &&
    Array.isArray(json.manipulationTactics) &&
    Array.isArray(json.requestedInformation) &&
    Array.isArray(json.recommendedActions) &&
    typeof json.safeReply === 'string' &&
    json.evidenceBasis &&
    Array.isArray(json.evidenceBasis.evidence) &&
    Array.isArray(json.evidenceBasis.inference) &&
    Array.isArray(json.evidenceBasis.uncertainty);

  if (!ok) return false;

  // Guard: AI score must stay close to heuristic (prevents hallucinated verdicts)
  const scoreDiff = Math.abs(json.riskScore - heuristicScore);
  if (scoreDiff > 20) {
    console.warn(`[ai] Score drift too large: AI=${json.riskScore} vs heuristic=${heuristicScore}, diff=${scoreDiff} — clamping`);
    // Clamp rather than reject
    json.riskScore = Math.round(heuristicScore + Math.sign(json.riskScore - heuristicScore) * 15);
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalize AI output to consistent internal format
// ─────────────────────────────────────────────────────────────────────────────

function normalize(json, heuristic) {
  const score = Math.max(0, Math.min(98, Math.round(json.riskScore)));

  const VALID_LEVELS = new Set(['safe', 'low', 'suspicious', 'high', 'critical']);
  const VALID_CATEGORIES = new Set([
    'phishing', 'fake_prize', 'job_scam', 'investment_scam', 'payment_scam',
    'impersonation', 'account_takeover', 'delivery_scam', 'romance', 'tech_support', 'unknown',
  ]);

  // Derive level from score if AI gave invalid level
  function scoreToLevel(s) {
    if (s <= 19) return 'safe';
    if (s <= 39) return 'low';
    if (s <= 59) return 'suspicious';
    if (s <= 79) return 'high';
    return 'critical';
  }

  const riskLevel = VALID_LEVELS.has(json.riskLevel) ? json.riskLevel : scoreToLevel(score);
  const category = VALID_CATEGORIES.has(json.category) ? json.category : heuristic.category.id;

  return {
    riskScore: score,
    riskLevel,
    // Keep heuristic's riskLabel and riskTone (they match the score tiers)
    riskLabel: heuristic.riskLabel,
    riskTone: heuristic.riskTone,
    category: VALID_CATEGORIES.has(json.category)
      ? { ...heuristic.category, id: json.category, label: formatCategoryLabel(json.category) }
      : heuristic.category,
    outcomeText: heuristic.outcomeText,
    summary: String(json.summary || heuristic.summary),
    dimensions: heuristic.dimensions, // Always use heuristic dimensions (deterministic)
    confidence: Math.max(0, Math.min(96, Math.round(json.confidence || heuristic.confidence))),
    confidenceLabel: heuristic.confidenceLabel,
    reasons: Array.isArray(json.reasons) && json.reasons.length > 0
      ? json.reasons.map((r, i) => ({
          n: i + 1,
          title: String(r.title || 'Signal'),
          tone: r.contribution === 'HIGH' ? 'red' : r.contribution === 'MEDIUM' ? 'orange' : 'yellow',
          contribution: ['HIGH', 'MEDIUM', 'LOW'].includes(r.contribution) ? r.contribution : 'MEDIUM',
          explanation: String(r.explanation || ''),
          evidence: String(r.evidence || ''),
        })).slice(0, 10)
      : heuristic.reasons,
    manipulationTactics: Array.isArray(json.manipulationTactics) && json.manipulationTactics.length > 0
      ? json.manipulationTactics.map((t) => ({ name: String(t.name || ''), blurb: String(t.blurb || '') }))
      : heuristic.manipulationTactics,
    requestedInformation: Array.isArray(json.requestedInformation) && json.requestedInformation.length > 0
      ? json.requestedInformation.map((r) => ({ kind: String(r.kind || ''), sensitivity: String(r.sensitivity || 'MEDIUM') }))
      : heuristic.requestedInformation,
    urlIndicators: heuristic.urlIndicators, // Always deterministic from engine
    recommendedActions: Array.isArray(json.recommendedActions) && json.recommendedActions.length > 0
      ? json.recommendedActions.map(String).slice(0, 8)
      : heuristic.recommendedActions,
    safeReply: String(json.safeReply || heuristic.safeReply),
    attackChain: heuristic.attackChain, // Always from heuristic (category-based)
    evidenceBasis: {
      evidence: (json.evidenceBasis?.evidence || heuristic.evidenceBasis.evidence).map(String).slice(0, 8),
      inference: (json.evidenceBasis?.inference || heuristic.evidenceBasis.inference).map(String).slice(0, 6),
      uncertainty: (json.evidenceBasis?.uncertainty || heuristic.evidenceBasis.uncertainty).map(String).slice(0, 6),
    },
    disclaimers: heuristic.disclaimers,
    // AI-only extras
    scamCategory: String(json.scamCategory || ''),
    redFlags: Array.isArray(json.redFlags) ? json.redFlags.map(String).slice(0, 8) : [],
  };
}

function formatCategoryLabel(id) {
  const labels = {
    phishing: 'Phishing', fake_prize: 'Fake Prize', job_scam: 'Job Scam',
    investment_scam: 'Investment Scam', payment_scam: 'Payment Scam',
    impersonation: 'Impersonation', account_takeover: 'Account Takeover Attempt',
    delivery_scam: 'Delivery Scam', romance: 'Romance / Social Engineering',
    tech_support: 'Tech Support Scam', unknown: 'Unknown Suspicious Pattern',
  };
  return labels[id] || id;
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM call
// ─────────────────────────────────────────────────────────────────────────────

async function callLLM(systemPrompt, userContent, isVision = false) {
  const messages = [{ role: 'system', content: systemPrompt }];

  if (isVision) {
    messages.push({ role: 'user', content: userContent }); // array of parts for vision
  } else {
    messages.push({ role: 'user', content: String(userContent) });
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.1, // Lower temperature = more consistent, evidence-bound output
      // Cap output tokens so we stay under free-tier per-minute output limits
      // (e.g. Groq qwen free tier = 1000 OTPM). The JSON report fits comfortably.
      max_tokens: Number(process.env.AI_MAX_TOKENS) || 800,
      // Disable chain-of-thought on reasoning models (Qwen) — it wastes output
      // tokens (blowing the OTPM limit) and pollutes the JSON. Ignored by models
      // that don't support it.
      reasoning_effort: 'none',
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS) || 20000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`AI provider error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI returned empty content');

  return parseModelJson(content);
}

/**
 * OCR-only vision call: ask the vision model to TRANSCRIBE the text in an image
 * and return it as plain text. This keeps output small (well under free-tier
 * output-token limits) and reliable — our heuristic engine then scores the text.
 * Returns the extracted text (possibly empty string) or throws on API error.
 */
async function extractTextFromImage(dataUrl) {
  const messages = [
    {
      role: 'system',
      content:
        'You are an OCR engine. Transcribe ALL visible text in the image exactly as it appears, preserving numbers, links, and wording. Output ONLY the transcribed text — no commentary, no analysis. If there is no readable text, output an empty response.',
    },
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: dataUrl } },
        { type: 'text', text: 'Transcribe all the text visible in this screenshot.' },
      ],
    },
  ];

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0,
      max_tokens: Number(process.env.AI_OCR_MAX_TOKENS) || 700,
      reasoning_effort: 'none',
    }),
    signal: AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS) || 20000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Vision OCR error ${res.status}: ${body.slice(0, 160)}`);
  }
  const data = await res.json();
  let text = data.choices?.[0]?.message?.content || '';
  // Strip any stray reasoning/markdown the model may add.
  text = String(text).replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```/g, '').trim();
  return text;
}

/**
 * Robustly extract a JSON object from a model's reply. Reasoning models (e.g.
 * Qwen) may wrap output in <think>…</think> or ```json fences before the JSON,
 * which breaks a naive JSON.parse. Strip those and parse the first {...} block.
 */
function parseModelJson(raw) {
  let s = String(raw);
  // Remove <think>…</think> reasoning blocks.
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Remove markdown code fences.
  s = s.replace(/```(?:json)?/gi, '');
  // Extract the first balanced-looking JSON object.
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  return JSON.parse(s.trim());
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: analyse text/url — heuristic first, AI explains over evidence
// ─────────────────────────────────────────────────────────────────────────────

export async function analyzeWithFallback({ content, type = 'text' }) {
  // Step 1: ALWAYS run heuristic engine first (deterministic, no AI needed)
  const heuristic = analyzeContent(content, type);

  // Step 2: If no AI key, return heuristic result directly
  if (!process.env.AI_API_KEY) {
    return { result: heuristic, mode: 'demo', aiUsed: false };
  }

  // Step 3: Build evidence context — AI receives pre-computed signals, not raw text
  const evidenceContext = buildEvidenceContext(heuristic, content, type);

  // Step 4: Call AI with structured evidence
  try {
    let parsed = null;
    for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
      try {
        const raw = await callLLM(buildSystemPrompt(), evidenceContext);
        if (validateAiPayload(raw, heuristic.riskScore)) {
          parsed = normalize(raw, heuristic);
        } else {
          console.warn(`[ai] Attempt ${attempt + 1}: output failed validation`);
        }
      } catch (attemptErr) {
        console.warn(`[ai] Attempt ${attempt + 1} failed:`, attemptErr.message);
        if (attempt === 0) await new Promise(r => setTimeout(r, 500)); // small backoff
      }
    }

    if (!parsed) throw new Error('AI output failed validation after 2 attempts');

    return { result: parsed, mode: 'ai', aiUsed: true, heuristic };
  } catch (err) {
    console.warn('[scamshield] Live AI failed, using heuristic fallback:', err.message);
    return { result: heuristic, mode: 'demo', aiUsed: false, aiError: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: analyse an image — vision AI when available, heuristic on text otherwise
// ─────────────────────────────────────────────────────────────────────────────

export async function analyzeImageWithFallback({ dataUrl, visibleText }) {
  // Preferred path: use the vision model ONLY to transcribe the screenshot text
  // (small, reliable output), then score that text with our strong heuristic
  // engine. This avoids asking a rate-limited free model for a huge JSON report,
  // and reuses the same deterministic detection used for pasted text.
  if (process.env.AI_API_KEY && dataUrl) {
    try {
      const ocrText = await extractTextFromImage(dataUrl);
      const combined = [visibleText, ocrText].filter((t) => t && t.trim()).join('\n').trim();
      if (combined) {
        const heuristic = analyzeContent(combined, 'text');
        return {
          result: {
            ...heuristic,
            inputSummary: combined.slice(0, 90),
            visualScan: {
              label: 'AI vision scan (text extracted)',
              note: 'Text was read directly from the screenshot by the AI vision model, then analyzed against known scam patterns by the detection engine.',
              extractedText: ocrText.slice(0, 500),
            },
          },
          mode: 'ai',
          aiUsed: true,
          visualSource: 'ai_ocr',
        };
      }
      // OCR found nothing readable — fall through to the honest "not assessed"
      // path below (never a fake "safe").
      console.warn('[scamshield] Image OCR returned no readable text.');
    } catch (err) {
      console.warn('[scamshield] Image OCR failed, falling back:', err.message);
    }
  }

  // Demo-mode image path — honest about limitations
  if (visibleText && visibleText.trim().length > 0) {
    const heuristic = analyzeContent(visibleText, 'text');
    return {
      result: {
        ...heuristic,
        visualScan: {
          label: 'Text-based scan (demo mode)',
          note: 'The visible text you provided was analyzed using the heuristic engine. Configure an AI_API_KEY with a vision-capable model to enable automatic image text extraction.',
        },
      },
      mode: 'demo',
      aiUsed: false,
      visualSource: 'user_supplied_text',
    };
  }

  // No visible text AND no vision AI → we genuinely cannot read the screenshot.
  // Returning a low "safe" score here is misleading and dangerous (a scam
  // screenshot would look safe). Return an HONEST "cannot assess" result instead.
  const base = analyzeContent('', 'image');
  return {
    result: {
      ...base,
      riskScore: 0,
      riskLevel: 'unknown',
      riskLabel: 'NOT ASSESSED',
      riskTone: 'yellow',
      category: { id: 'unknown', label: 'Not Assessed', icon: 'shield', tone: 'yellow' },
      outcomeText: 'COULD NOT READ THE IMAGE — PASTE THE VISIBLE TEXT TO ANALYZE',
      summary:
        'This screenshot could not be analyzed automatically because no readable text was provided and image text-extraction (OCR/vision AI) is not enabled on this deployment. This is NOT a verdict that the message is safe. Type or paste the message text shown in the screenshot to get a real assessment.',
      confidence: 0,
      confidenceLabel: 'NONE',
      reasons: [],
      recommendedActions: [
        'Type or paste the visible text from the screenshot into the "Visible text" box and analyze again.',
        'Do NOT treat this as a safe result — no analysis was performed on the image content.',
      ],
      evidenceBasis: {
        evidence: ['No readable text was supplied and no image text-extraction is configured.'],
        inference: [],
        uncertainty: ['The content of the screenshot is completely unknown to the analyzer.'],
      },
      visualScan: {
        label: 'Not assessed — text required',
        note: 'No visible text was supplied and no AI vision model is configured, so the screenshot could not be read. Paste the message text to analyze it. (Enable AI_API_KEY with a vision model for automatic image reading.)',
      },
      notAssessed: true,
    },
    mode: 'demo',
    aiUsed: false,
    visualSource: 'not_assessed',
  };
}
