# Phase 03 — Campaigns

**Depends on:** Phase 02 (contacts in Firestore). [CONTACT_CONTRACT.md](./CONTACT_CONTRACT.md) campaign + message shapes.

**Goal:** The operator can create a campaign for **any** channel, pick an audience, write a template with merge fields, preview three schools, and confirm. The app writes `queued` message rows. **Nothing is sent** — adapters are stubs that only mark `skipped` with reason `provider_not_configured`.

---

## Why this is now

WhatsApp, SMS, and email must share one confirm/queue/log path. If we send WhatsApp with a one-off script, we will never get a safe SMS or Gmail drip.

---

## What we build

### Campaign editor

- Name, channel picker (WhatsApp / SMS / Email).
- Audience: current contact filters or “everyone who can use this channel”.
- Live count: “1,204 schools will get this”.
- Template body with `{{school_name}}`, `{{area}}`, `{{owner_name}}`, `{{website}}`.
- Email also has subject.
- Throttle fields visible for email (defaults 180s / 400 day); hidden or ignored for others in the UI if they confuse people.
- Preview: three random matching contacts with merge applied.
- Confirm: typed sentence or checkbox “Send to N schools on {channel}”. Then status → `confirmed` and messages are queued.

### Queue writer

- One message per matching contact.
- Skip (do not queue) if the contact cannot use that channel, or is suppressed.
- Idempotency key set. Second confirm on the same campaign does not duplicate rows.

### Logs screen (read-only)

- Lists queued messages. Status filter works even while everything is `queued` / `skipped`.

### Dry send

- A `processQueue` function exists and, in Phase 03, only processes `skipped` / leaves `queued` if the adapter is missing. Phases 04–06 replace the adapter.

### Tests

- Merge: missing `owner_name` does not print the word `null`.
- Queue size equals eligible contacts.
- Second confirm does not double-queue.

---

## Files (indicative)

- `src/app/campaigns/page.tsx`
- `src/app/campaigns/new/page.tsx`
- `src/app/campaigns/[id]/page.tsx`
- `src/app/logs/page.tsx`
- `src/lib/merge/render.ts`
- `src/lib/campaigns/create.ts`
- `src/lib/campaigns/queue.ts`
- `src/lib/send/adapters.ts` (stubs)
- `src/lib/send/process.ts`
- `test/merge.test.ts`
- `test/queue.test.ts`

---

## Exit criteria

- [ ] Operator can create a WhatsApp-channel campaign against “has phone”, see a count, preview, confirm
- [ ] Firestore has one message row per eligible contact, none for no-phone contacts
- [ ] Logs page shows those rows as queued
- [ ] No HTTP calls to Twilio, Termii, or Gmail

---

## Handoff to Phase 04

Phase 04 implements the WhatsApp adapter and a “run campaign” action that calls `processQueue`. Campaign UI and queue writer must not be rewritten — only the adapter and the run button become live.
