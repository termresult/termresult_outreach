# Architecture — TermResult Outreach

**Created:** August 20, 2026  
**Status:** Active  
**Related:** [00_OVERVIEW.md](./00_OVERVIEW.md) · [CONTACT_CONTRACT.md](./CONTACT_CONTRACT.md) · [ENVIRONMENT.md](./ENVIRONMENT.md)

---

## 1. System shape

```
Browser (operator)
      │
      ▼
Next.js on Vercel
  App Router pages (Contacts, Campaigns, Logs)
  Server routes / server actions (import, enqueue, send tick)
      │
      ├── Firebase Auth (who is allowed in)
      ├── Firestore (contacts, campaigns, messages, suppressions)
      │
      ├── Twilio WhatsApp
      ├── Termii SMS
      └── Gmail API (Workspace OAuth)
```

School Discovery stays **outside**. A human (or Phase 02 import screen) uploads the CSV/JSON once. After that, Firestore is what the app reads.

---

## 2. Two jobs, one model

| Job | Who | When |
| --- | --- | --- |
| **Import** | Operator uploads a file | Rare (after a new scrape) |
| **Send** | Operator starts a campaign; the server walks the queue | WhatsApp/SMS can go in small parallel batches; email is a slow tick |

The **message** row is the unit of work: one contact × one campaign × one channel. Status moves `queued → sending → sent | failed | skipped`. Providers get an idempotency key so a Vercel retry does not double-send.

---

## 3. Channel adapters

Each adapter exposes the same idea: `canSend(contact)`, `send(message)`, `handleWebhook(providerEvent)`.

- **WhatsApp (Twilio):** only contacts with a usable mobile. Outbound marketing must use a **pre-approved template**. Inbound “STOP” writes a suppression.
- **SMS (Termii):** same phone rules. Respect Nigeria DND: default to a route the account is allowed to use; show the operator if a number is likely DND-blocked. Delivery receipts update the message row.
- **Email (Gmail):** only contacts with a real email. Send as the Workspace user. Sleep between sends (default 180 seconds). Stop at the daily cap. Resume tomorrow from the same campaign.

Phase 03 builds the queue and UI. Phases 04–06 only fill the adapter.

---

## 4. Why Firebase + Vercel (not Laravel)

`termresultbackend` is the school OS. Outreach is an **internal sales tool**. Mixing campaign logs into tenant school data would confuse both products. Firebase is already how TermResult ships small apps; a new project keeps Maps billing and outreach data apart.

Vercel serverless is fine for WhatsApp/SMS bursts (webhook + enqueue). Email needs a **scheduled tick** (Vercel Cron hitting an internal send route) so we do not hold one request open for hours.

---

## 5. Auth

Google sign-in. Allow-list emails (or a Google Group) in env / Firestore `settings/allowlist`. Nobody else gets in. No public marketing site in this repo.

---

## 6. Data ownership

| Store | Owns |
| ----- | ---- |
| School Discovery run folder | Historical scrape (do not modify from this app) |
| Firestore `contacts` | Working copy for send |
| Firestore `messages` | Truth of what we sent |
| Provider dashboards | Billing only; we still log locally |

Re-import matches on `source_place_id` (Maps `ChIJ…` or `emis:…`). Update name/phone/email. Do not delete message history.

---

## 7. UI surfaces (all phases share this map)

- **Home** — counts: schools, phones, emails, campaigns in flight
- **Contacts** — table, search, filters (has phone / has email / area / source)
- **Import** — upload CSV or JSON
- **Campaigns** — new campaign, pick channel, pick list or filters, write template, preview three schools, confirm send
- **Logs** — filter by campaign, status, channel
- **Settings** — daily email cap, email delay, sender name, test numbers (Phase 07 can polish; keys stay in Vercel env)

---

## 8. Design intent (implement at build time)

Internal tool, light background, no gradients, one accent colour, large readable table, user-friendly copy. Follow the standing TermResult web taste (same family as School Finder: calm, not a dashboard-from-hell). Actual components and strings are chosen in implementation, not here.
