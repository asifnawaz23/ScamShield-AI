# ScamShield AI — Demo Scenarios (Pakistan Market)

These scenarios demonstrate the full detection range using **Pakistani scam patterns**.
All results are deterministic — same input always produces the same score.

---

## Scenario A — CRITICAL: HBL Bank Impersonation + Phishing Link

**Input (paste into "Paste text" tab):**

```
Aapka HBL account 24 ghanton mein band ho jayega. Account block se bachne ke liye
abhi apni CNIC aur ATM PIN verify karein.
Link: http://hbl-secure-verify.xyz/confirm
Kisi ko mat batayein. Ye sirf aapke liye hai.
```

**Expected results:**
- Risk score: **75–92 / 100** (HIGH / CRITICAL)
- Category: **Bank / Government Impersonation**
- Detected signals: fear, authority (HBL), credential (CNIC + ATM PIN), urgency, bypass, suspicious URL
- URL indicators: Known Scam Domain Pattern (hbl + .xyz), Brand-style Domain Token
- Evidence: Literal quotes shown from the message
- Attack chain: Account takeover path

**Key point for judges:** The CNIC + ATM PIN request is a CRITICAL sensitivity item unique to Pakistan.

---

## Scenario B — CRITICAL: BISP/Ehsaas Government Welfare Scam

**Input:**

```
Pakistan Government ki taraf se khush khabri! Aapka Ehsaas Program mein
Rs. 25,000 ki raqam tayar hai. Abhi apna CNIC number aur registered mobile
number 8171 par bhejein aur apni raqam hasil karein.
Jaldi karein, offer aaj raat tak valid hai.
```

**Expected results:**
- Risk score: **70–90 / 100** (HIGH / CRITICAL)
- Category: **Fake Prize / Lucky Draw** (welfare scam)
- Signals: welfarescam, nadra (CNIC request), reward, urgency, tooGood
- BISP 8171 spoofing flagged explicitly
- Confidence: MODERATE–HIGH

**Key point:** Targets Pakistan's most vulnerable citizens — BISP beneficiaries.

---

## Scenario C — CRITICAL: JazzCash OTP Theft

**Input:**

```
Aapka JazzCash account suspicious activity ki wajah se band ho raha hai.
Account unlock karne ke liye abhi apna 6-digit OTP code share karein
jo aapke number par aaya hai.
Customer care: +92 300 1234567 par WhatsApp karein.
```

**Expected results:**
- Risk score: **60–80 / 100** (HIGH)
- Category: **Account Takeover Attempt**
- Signals: otp, fear, bypass (WhatsApp redirect), authority (JazzCash)
- Phone redirect signal: +92 WhatsApp contact flagged
- Requested info: OTP (CRITICAL sensitivity)

---

## Scenario D — LOW RISK: Legitimate Message

**Input:**

```
Dear Customer, your Daraz order #DZ-98765 has been confirmed.
Estimated delivery: 3-5 working days. Track at daraz.pk/orders.
No action needed.
```

**Expected results:**
- Risk score: **5–18 / 100** (LIKELY SAFE)
- Category: Unknown / Safe
- Daraz.pk is a trusted domain — not flagged
- Shows false-positive protection working

---

## Scenario E — UNKNOWN: Insufficient Evidence

**Input:**

```
Aap se baat karni hai, zaruri kaam hai.
```

**Expected results:**
- Risk score: **6–12 / 100**
- Confidence: **LOW**
- Category: Unknown
- No signals matched

**Key point:** System does NOT force a verdict. Honest "unknown" result.

---

## Scenario F — HIGH RISK: Forex/Crypto Investment Scam

**Input:**

```
Pakistan ka #1 Forex Trading Group! Expert signals se guaranteed 150% weekly return.
Sirf Rs. 10,000 se shuru karein aur ek hafte mein double karein.
Limited slots — aaj hi WhatsApp karein: +92 321 9876543.
Bitcoin, USDT, JazzCash sab accept hai.
```

**Expected results:**
- Risk score: **65–85 / 100** (HIGH)
- Category: **Investment / Forex Scam**
- Signals: investment, tooGood, urgency, bypass (WhatsApp redirect)
- JazzCash payment mentioned

---

## URL Analysis Demo

**Input (paste into "Analyze URL" tab):**

```
http://nadra-cnic-update.online/verify-biometric
```

**Expected results:**
- Risk score: **70+ / 100** (HIGH)
- URL indicators:
  - DANGER: Known Scam Domain Pattern (nadra + .online)
  - WARNING: High-Risk Domain Extension (.online)
  - WARNING: Action-Oriented Path (/verify)
  - DANGER: Brand-style Domain Token (cnic, update, verify)
- Reputation: Not configured (honest — no fake results)

---

## Kiro Workflow Demo (2:20–3:00 in video)

Show `.kiro/specs/`:
1. `requirements.md` — 14 user stories with acceptance criteria
2. `design.md` — complete architecture, AI design, scoring system
3. `tasks.md` — implementation checklist with completed items
