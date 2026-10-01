# Logging — TermResult Grants

**Created:** September 5, 2026  
**Status:** Active  
**Related:** [ARCHITECTURE.md](./ARCHITECTURE.md) · parent [../LOGGING.md](../LOGGING.md)

The operator trusts the Grants log more than the terminal. Server logs exist so we can debug Vercel.

---

## 1. Events (use these names)

| Event | When |
| ----- | ---- |
| `grants.profile.saved` | Profile fields or documents changed |
| `grants.discover.start` | Cron or Find grants |
| `grants.discover.source` | One source ran (counts only) |
| `grants.discover.end` | Created, updated, discarded, failed |
| `grants.ingest.url` | Paste-URL accepted or rejected |
| `grants.match.ran` | Grants scored; how many eligible |
| `grants.draft.start` | Pack generation began |
| `grants.draft.ready` | Pack stored; `needs_operator` yes/no |
| `grants.draft.failed` | Short error class |
| `grants.apply.confirmed` | Operator hit send or mark submitted |
| `grants.apply.queued` | Email row written |
| `grants.apply.sent` | Gmail accepted (store provider id) |
| `grants.apply.failed` | Error class + short reason |
| `grants.apply.portal` | Marked submitted_portal |
| `grants.deadline.warn` | Due in 14 days or 3 days |

---

## 2. What never appears in logs

LLM keys, search keys, Gmail refresh tokens, full uploaded file bytes, full fetched HTML. Funder emails **may** appear on the application row. In Vercel logs, mask to domain.

---

## 3. Operator-visible log

Each application shows: funder, title, apply-via, status, deadline, last event, one-line error. Filter chips: Matches / Ready / Sent / Portal / Closed. Phase 07 can add CSV export of the application list.
