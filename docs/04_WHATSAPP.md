# Phase 04 — WhatsApp (Twilio)

**Depends on:** Phase 03 queue. Twilio account with a WhatsApp-enabled sender and at least one **Meta-approved template**. [ENVIRONMENT.md](./ENVIRONMENT.md). Event wording can still be a placeholder.

**Goal:** First real sends. A non-technical person can push a WhatsApp campaign to a **test number**, then (second confirmation) to the real phone list. Delivery callbacks update the log. This is the first **demoable** product.

---

## Why this is now

WhatsApp is the event channel. Twilio WhatsApp is what we were asked to use. SMS pricing is a later, different vendor.

---

## What we build

### Provider setup (human)

- Twilio WhatsApp sandbox or production sender.
- Template in Meta Business Manager (event invite). Variables aligned with our merge fields (usually school name).
- Store `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`.
- Public webhook URL on Vercel for status + inbound.

### Adapter

- `canSend`: has `phone_e164`, not suppressed for WhatsApp.
- `send`: Twilio content/template API (not a free-form session message for cold outreach). Pass merge variables. Save Twilio SID.
- Marketing/cold traffic **must** use the approved template. Do not pretend we can blast arbitrary paragraphs until a session exists.

### Run

- Campaign page: “Send test to my phone” then “Send to everyone”.
- Process the queue in small batches so a Vercel timeout does not strand thousands of in-flight requests. Resume from remaining `queued` rows.
- Campaign status `running` → `done` when no `queued` left.

### Webhooks

- Delivery / undelivered / failed → update message status.
- Inbound body containing stop/unsubscribe → suppression for that number, channel WhatsApp (or `all` if they said stop everything).

### Operator copy

- Plain language: “WhatsApp will only send the approved template. Change the official template in Twilio/Meta, not in this text box” if that is how templates work for the account. If Twilio lets us map body → template variables, the editor stays.

### Tests

- Adapter refuses a contact without `phone_e164`.
- Idempotency: same message id does not call Twilio twice (mock).
- STOP inbound creates a suppression.

---

## Files (indicative)

- `src/lib/send/whatsapp-twilio.ts`
- `src/app/api/send/whatsapp/route.ts` (or process route)
- `src/app/api/webhooks/twilio/route.ts`
- `src/lib/send/process.ts` (wire adapter)
- `test/whatsapp-adapter.test.ts`

---

## Exit criteria

- [ ] Test send arrives on the operator’s WhatsApp
- [ ] A 3-school (or 3-test) campaign writes `sent` + provider ids
- [ ] Failed number shows a human error on Logs
- [ ] STOP (or a simulated webhook) suppresses that number
- [ ] No SMS provider and no Gmail API calls
- [ ] Preview URL is usable without a terminal

---

## Handoff to Phase 05

Phase 05 adds the SMS adapter and a channel=`sms` campaign. It reuses queue, logs, confirm, suppressions. It must not add a second contacts table.

---

## Future (not v1)

Two-way inbox, media cards, RSVP buttons, Meta Cloud API instead of Twilio if cost bites.
