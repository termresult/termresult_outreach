# Logging — TermResult Outreach

**Created:** August 20, 2026  
**Status:** Active  
**Related:** [ARCHITECTURE.md](./ARCHITECTURE.md)

The operator trusts the **Send log** screen more than the terminal. Server logs exist so we can debug Vercel.

---

## 1. Events (use these names)

| Event | When |
| ----- | ---- |
| `auth.denied` | Email not on allow-list |
| `import.start` | File accepted |
| `import.row` | One contact created or updated (sample, not every row in stdout) |
| `import.end` | Counts: created, updated, skipped, invalid |
| `campaign.created` | Channel + audience size |
| `campaign.confirmed` | Operator hit Send |
| `message.queued` | One row written |
| `message.sending` | Adapter called |
| `message.sent` | Provider accepted (store provider id) |
| `message.failed` | Error class + short reason (never dump the API key) |
| `message.skipped` | Why: no phone, no email, suppressed, already sent |
| `webhook.delivery` | Twilio / Termii status update |
| `email.tick` | Cron ran; sent N; remaining; cap hit or not |
| `quota.warn` | Provider 429 or Gmail daily cap |

---

## 2. What never appears in logs

Full Twilio token, Termii key, Gmail refresh token, raw request bodies that include those secrets. Phone and email **may** appear in Firestore message rows (the operator needs them). In Vercel logs, mask to last 4 digits / email domain.

---

## 3. Operator-visible log

Each message row shows: school name, channel, to-address, status, time, one-line error. Filter chips: All / Sent / Failed / Skipped. Export CSV of a campaign log in Phase 07.
