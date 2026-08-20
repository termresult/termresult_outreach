# Phase 01 — Foundation

**Depends on:** Human creates a **new Firebase** project under `officialtermresult@gmail.com` and a Vercel project. [CONTACT_CONTRACT.md](./CONTACT_CONTRACT.md), [ENVIRONMENT.md](./ENVIRONMENT.md), [ARCHITECTURE.md](./ARCHITECTURE.md).

**Goal:** Stand up the Next.js app, wire Firebase Auth + Firestore, and persist the **full** contact / campaign / message / suppression model — including all three channels — before any provider is connected. A teammate can log in with Google and see an empty shell.

---

## Why this is first

If we bolt WhatsApp onto ad-hoc CSV sends, SMS and Gmail will each invent their own lists. Phase 01 makes one home for people and campaigns. Later phases only add adapters.

---

## What we build

### App shell

- Next.js App Router, TypeScript, pnpm, deployable to Vercel from `termresult_outreach/`.
- Routes reserved: `/` (home counts), `/contacts`, `/import`, `/campaigns`, `/campaigns/new`, `/logs`, `/settings`.
- Phase 01: home + a signed-in “you are in” screen. Other routes can be stub pages with a title.

### Auth

- Google sign-in via Firebase Auth.
- Server and middleware reject emails not on `ALLOWLIST_EMAILS`.
- Sign-out.

### Firestore

- Collections: `contacts`, `campaigns`, `messages`, `suppressions`, `settings`.
- Security rules: only authenticated allow-listed users; no public read.
- Types/helpers that match [CONTACT_CONTRACT.md](./CONTACT_CONTRACT.md): `OutreachContact`, `Campaign`, `Message`, `Suppression`.
- A function `emptyContact(sourcePlaceId)` that returns the full contact with nulls already in place.

### Config

- Load env names from ENVIRONMENT. App boots without Twilio/Termii/Gmail keys (those phases add them). Refuse to boot if Firebase public config is missing.

### Tests

- Contact shape test against the example JSON keys.
- Allow-list: unknown email cannot see contacts (or a unit test of the guard).

---

## Files (indicative)

- `package.json`
- `tsconfig.json`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/login/page.tsx`
- `src/lib/firebase/client.ts`
- `src/lib/firebase/admin.ts`
- `src/lib/auth/allowlist.ts`
- `src/types/contact.ts`
- `src/types/campaign.ts`
- `src/types/message.ts`
- `firestore.rules`
- `test/contact-contract.test.ts`

---

## Exit criteria

- [ ] `pnpm` install and local dev work
- [ ] Google login works for an allow-listed TermResult email and fails for another
- [ ] Firestore rules deployed; a logged-in user can write a dummy contact from a one-off seed (or admin script) and see it is blocked from the public internet
- [ ] Types match the contract keys
- [ ] Deployed to a Vercel preview URL
- [ ] No Twilio / Termii / Gmail calls

---

## Handoff to Phase 02

Phase 02 needs a working app, Auth, Firestore, and `OutreachContact`. It will add import + the contacts table. It must not invent a second contact shape.
