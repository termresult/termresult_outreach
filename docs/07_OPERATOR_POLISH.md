# Phase 07 — Operator polish

**Depends on:** Phases 01–06 working on a preview or production URL.

**Goal:** Someone who is not an engineer can run an event campaign without a walkthrough. Home numbers are honest. Logs export. Mistakes are hard.

---

## What we build

### Home

- Big numbers: contacts, with phone, with email, campaigns running, sent today (by channel).
- Links: Import, New WhatsApp, New SMS, New email.

### Safety and copy

- Every broadcast confirm names the channel and the count.
- Settings: test phone, test email, email cap, email gap — in words (“wait 3 minutes between emails”), not only integers.
- Empty states: “Upload the school list first” instead of a blank table.

### Reports

- Per campaign: queued / sent / failed / skipped.
- Export that campaign’s log as CSV (name, to, status, error).
- Home does not show API keys or Firebase internals.

### Small quality

- Loading and error toasts a human understands.
- Don’t lose filter state when returning from a contact.
- Mobile-usable enough to check logs on a phone (desktop is primary).

### Tests

- Confirm dialog copy includes the count (component or integration test).
- CSV export columns match what the operator sees.

---

## Files (indicative)

- `src/app/page.tsx` (real counts)
- `src/app/settings/page.tsx`
- `src/lib/reports/campaign-summary.ts`
- `src/app/api/campaigns/[id]/export/route.ts`

---

## Exit criteria

- [ ] A non-engineer can: log in → import (if needed) → create WhatsApp campaign → test send → understand the log
- [ ] Same for SMS and a paused/resumable email drip
- [ ] Definition of done in [00_OVERVIEW.md](./00_OVERVIEW.md) is met

---

## Handoff

v1 complete. Later work (inbox, RSVP, LLM letters, Meta Cloud API) is new phases — extend the overview table; do not sneak them into 07.
