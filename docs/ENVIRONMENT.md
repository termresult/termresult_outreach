# Environment — TermResult Outreach

**Created:** August 20, 2026  
**Status:** Active  
**Related:** [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 1. What is hardcoded vs secret

| Kind | Examples | Where |
| ---- | -------- | ----- |
| Hardcoded | Channel names (`whatsapp`, `sms`, `email`), default throttle 180s / 400 per day, merge field names, FCT area labels | Source |
| Config (non-secret) | Firebase project id, Gmail “from” display name, Twilio WhatsApp sender (the `whatsapp:+…` number once public) | Vercel env, safe to show in Settings as text |
| Secret | Twilio auth token, Termii API key, Firebase admin / client keys as appropriate, Gmail OAuth refresh token or service account | Vercel env **only**. Never `NEXT_PUBLIC_` for tokens. |

`.env.local` for laptop. Vercel project env for production. `.gitignore` the env files.

---

## 2. Accounts a human must create (Phase 01–06)

| Account | Who | Notes |
| ------- | --- | ----- |
| **Firebase** | TermResult gmail (`officialtermresult@gmail.com`) | **New** project, e.g. `termresult-outreach`. Enable Google Auth + Firestore. Do not reuse the Maps GCP project as the Firebase app unless you deliberately want one bill — prefer a clean project. |
| **Vercel** | Same org as other TermResult sites | Link this repo / folder. |
| **Twilio** | TermResult | WhatsApp sender + template approval in Meta Business Manager. SMS on Twilio is **not** used in v1. |
| **Termii** (or chosen SMS) | TermResult | Nigeria sender ID registration. Naira billing. |
| **Google Workspace** | TermResult | Gmail API enabled on the Workspace project; OAuth consent; send-as the outreach mailbox. |

---

## 3. Env names (indicative)

Use these names so phases stay consistent:

- `NEXT_PUBLIC_FIREBASE_*` — public Firebase web config only
- `FIREBASE_ADMIN_*` or application default — server
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
- `TERMII_API_KEY`, `TERMII_SENDER_ID`, `TERMII_CHANNEL` (e.g. generic vs DND — decide at implementation after the live account)
- `GOOGLE_GMAIL_CLIENT_ID`, `GOOGLE_GMAIL_CLIENT_SECRET`, `GOOGLE_GMAIL_REFRESH_TOKEN` (or the equivalent Workspace secret shape)
- `GMAIL_FROM`, `EMAIL_DAILY_CAP` (default 400), `EMAIL_GAP_SECONDS` (default 180)
- `CRON_SECRET` — Vercel Cron header
- `ALLOWLIST_EMAILS` — comma-separated Google accounts that may log in

---

## 4. What this app must never load

- `GOOGLE_MAPS_API_KEY` from School Discovery
- Discovery `.env.local`

Import is a **file upload**, not a live Maps call.

---

## 5. Test mode

Settings (or env) hold a **test phone** and **test email**. First send of every channel goes there. Production broadcast requires a second confirmation checkbox: “This is the real list”.
