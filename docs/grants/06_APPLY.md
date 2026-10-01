# Phase 06 — Apply desk

**Depends on:** Phase 05 packs. Outreach Gmail adapter, throttle, and email tick already working (parent Phase 06).

**Goal:** The operator can send an email application after confirm, or finish a portal application by hand and mark it submitted. This is the “auto apply” we agreed: email when the funder takes email; portal stays human.

---

## Why this is now

The pack is ready. Sending without a confirm screen would spray funders. Portal bots are out of scope.

---

## What we build

### Email path

- Shown when `apply_via` is `email` or `either`.
- Confirm screen: To (`apply_email` or operator override), subject, cover, attachment kinds, grant title.
- Test address from Settings can intercept the first send of the day if that flag is on.
- Second checkbox: “This is the real application.”
- On confirm: write or reuse an Outreach `Message` with a grants idempotency key, status `queued_email`, then the existing Gmail send helper.
- Attach profile documents listed in `pack.attachment_kinds` if Gmail send can take them; if the current adapter is body-only, put a clear note and include storage links the operator can forward — prefer real attachments if the adapter can grow a file list without breaking school campaigns.
- Share `EMAIL_DAILY_CAP` / gap unless `GRANTS_EMAIL_DAILY_CAP` is set.
- Failures mark `grants.apply.failed` and keep the application editable.

### Portal path

- Shown when `apply_via` is `portal` or `either`.
- Open listing URL in a new tab.
- Copy buttons on each answer.
- Checklist of required fields and files.
- Fields: confirmation URL, submitted date. Action: **Mark submitted**.
- No password field.

### Safety

- Refuse send when `pack.needs_operator` is true unless the operator explicitly confirms “send with blanks.”
- Refuse send when `apply_email` is missing on the email path.
- Do not enqueue school campaign audiences.

### Tests

- Confirm without checkbox does not call Gmail.
- Idempotency: second confirm of the same application does not create a second sent message while status is `queued_email` or `submitted_email`.
- Portal mark-submitted does not call Gmail.
- `needs_operator` blocks send by default.

---

## Files (indicative)

- `src/lib/grants/apply-email.ts`
- `src/lib/grants/apply-portal.ts`
- `src/app/grants/[id]/apply-panel.tsx`
- `src/app/api/grants/[id]/confirm/route.ts`
- `src/app/api/grants/[id]/portal/route.ts`
- `src/lib/send/email-gmail.ts` (only if attachments must be added; keep school send working)
- `test/apply-email.test.ts`
- `test/apply-portal.test.ts`

---

## Exit criteria

- [ ] Confirmed email application reaches Gmail through the existing pipe and logs provider id
- [ ] Portal flow can be marked submitted with no email
- [ ] School campaigns still send as before
- [ ] Unconfirmed UI cannot send

---

## Handoff to Phase 07

Phase 07 needs statuses that move. It adds deadline banners, home polish, and a filterable log. It must not change apply rules.
