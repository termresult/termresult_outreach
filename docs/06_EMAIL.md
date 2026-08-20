# Phase 06 — Email (Gmail API)

**Depends on:** Phase 03 queue + throttle fields. Google Workspace mailbox. Gmail API OAuth (or the Workspace-approved secret shape in ENVIRONMENT). Contacts with a real `email`.

**Goal:** Last pipe. Each school gets a **customised** email (merge fields at minimum; operator can edit a longer letter). Sends are slow on purpose: default **one every 3 minutes**, **400 per day**, so a few hundred addresses take about two days. Resume the same campaign the next morning.

---

## Why this is last

Email volume is small (~hundreds, not thousands). Gmail is the right tool and the dangerous one if we spray. WhatsApp/SMS already cover the phone-heavy list. We do this only when the campaign machine is proven.

---

## What we build

### Human setup

- Enable Gmail API on a Google Cloud project tied to Workspace (this may live next to other TermResult Google work — **not** the Maps key).
- OAuth: send as the outreach mailbox. Store refresh token as a secret.
- `GMAIL_FROM`, `EMAIL_DAILY_CAP=400`, `EMAIL_GAP_SECONDS=180`, `CRON_SECRET`.

### Adapter

- `canSend`: valid `email`, not suppressed, not a dropped placeholder.
- `send`: Gmail API send (plain text or simple HTML). Subject + body after merge.
- One school per API call. No BCC blast of the whole list.

### Customisation

- v1: merge fields in subject and body so every letter names **that** school (and area/owner when present).
- Optional later: an “edit this one” drawer. Not required if merge is solid.
- Do **not** require an LLM in v1.

### Throttle

- Vercel Cron (every minute or every 3 minutes) hits an internal tick route with `CRON_SECRET`.
- Tick sends **at most one** email if `gap_seconds` have passed since the last successful email in that campaign, and today’s sent count is under `daily_cap`.
- When the cap hits: pause until the next calendar day (Africa/Lagos). Campaign stays `running`.
- Operator can Pause / Resume.

### Safety

- Test send to the operator email first.
- Second confirmation for the real list.
- Failures (bounce-like Gmail errors) mark `failed`; hard invalid addresses can suppress email-only.

### Tests

- Tick sends zero when cap is reached (fake clock / injected counts).
- Tick sends zero when last send was 60s ago and gap is 180s.
- Merge puts the school name in the subject.

---

## Files (indicative)

- `src/lib/send/email-gmail.ts`
- `src/app/api/cron/email-tick/route.ts`
- `vercel.json` (cron entry)
- `src/lib/send/throttle.ts`
- `test/throttle.test.ts`
- `test/email-adapter.test.ts`

---

## Exit criteria

- [ ] Test email arrives from the Workspace address with the school name merged
- [ ] A 5-address campaign sends one-by-one with the configured gap (can use a short gap in test env)
- [ ] Daily cap stops the tick; next day continues the same campaign
- [ ] WhatsApp and SMS campaigns unchanged
- [ ] Gmail quota errors surface as `quota.warn` / failed rows, not a crash loop

---

## Handoff to Phase 07

Phase 07 polishes copy, reports, and export. All three pipes exist. Do not add a fourth channel.
