# Phase 05 — Bulk SMS

**Depends on:** Phase 03–04 (same queue). A **Nigeria** SMS account with a REST API — default **Termii**. [ENVIRONMENT.md](./ENVIRONMENT.md).

**Goal:** Same campaign UI, channel = SMS, cheap local delivery. Twilio SMS is **not** used.

---

## Why this is now

Twilio SMS to `+234` is the expensive path we refused. WhatsApp cannot reach every phone (no WhatsApp, template limits). SMS is the fallback broadcast.

---

## Provider choice (v1 default)

| Provider | Role |
| -------- | ---- |
| **Termii** | Default. API-first, Nigeria billing, sender ID, delivery webhooks, DND product if we need it. |
| **Sendchamp** | Evaluate only if Termii signup, sender ID, or delivery is blocked. Same adapter interface. |
| Twilio SMS | Out of scope. |
| Portal-only bulk sites (CSV upload, no API) | Out of scope. |

Pick one live account in this phase. Do not abstract three SMS vendors “just in case”.

**Nigeria DND:** many mobiles are on the national DND list. Marketing SMS may not land unless we use the provider’s allowed route and a registered sender ID. The Settings page must say this in plain language. We do not promise 100% delivery.

---

## What we build

### Human setup

- Termii account, sender ID (`TermResult` or approved alias), API key, webhook secret.
- Decide `generic` vs `dnd` channel with whoever owns the Termii dashboard — record the choice in env, not in code comments only.

### Adapter

- Same `canSend` / `send` / webhook pattern as WhatsApp.
- Body = rendered merge template (SMS can be free text within length limits). Show segment count in the editor so the operator sees cost.
- Store Termii message id. Map delivery receipts onto `sent` / `failed`.

### UI

- New campaign → SMS. Reuse audience + confirm.
- Optional: suggest “everyone with a phone who is not on the last WhatsApp campaign” as a filter — only if it stays simple. Otherwise the operator uses has-phone.

### Tests

- Phone-less contacts are not queued.
- Mock Termii success and failure update status.
- Webhook with a bad secret is rejected.

---

## Files (indicative)

- `src/lib/send/sms-termii.ts`
- `src/app/api/webhooks/termii/route.ts`
- `src/lib/sms/segments.ts`
- `test/sms-adapter.test.ts`

---

## Exit criteria

- [ ] Test SMS arrives on a Nigerian handset
- [ ] Small campaign (3 numbers) logs sent/failed correctly
- [ ] WhatsApp campaigns still work
- [ ] No Gmail sends yet
- [ ] Operator can see “this is SMS, not WhatsApp” on the campaign page

---

## Handoff to Phase 06

Phase 06 adds Gmail. The queue must already support `throttle` on the campaign (fields exist from Phase 03). Email adapter will honour gap + daily cap. Do not reuse Termii for email.
