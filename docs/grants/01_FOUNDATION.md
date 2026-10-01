# Phase 01 — Foundation

**Depends on:** Outreach login and Firestore already live. [GRANT_CONTRACT.md](./GRANT_CONTRACT.md), [ENVIRONMENT.md](./ENVIRONMENT.md), [ARCHITECTURE.md](./ARCHITECTURE.md).

**Goal:** Add the Grants data model and an empty signed-in Grants section. A teammate can open `/grants` and `/grants/profile` and see a shell. No search, no LLM, no email.

---

## Why this is first

If we bolt a finder onto ad-hoc notes, match and apply will each invent their own shapes. Phase 01 makes one home for the profile, the catalog, and the application row. Later phases only fill jobs.

---

## What we build

### App shell

- Nav item **Grants** in `AppShell`, after Home (or after Proprietors — pick one place and keep it).
- Routes reserved: `/grants` (home counts), `/grants/profile`, `/grants/find`, `/grants/[id]`.
- Phase 01: home + profile stub + find stub. Detail can 404 until Phase 03 has grants.

### Firestore

- Collections: `company_profile`, `grant_sources`, `grants`, `applications`.
- Security rules: same allow-list as contacts. No public read.
- Types/helpers that match [GRANT_CONTRACT.md](./GRANT_CONTRACT.md): `CompanyProfile`, `GrantSource`, `Grant`, `Application`.
- A function `emptyCompanyProfile()` that returns the singleton with nulls already in place.
- A function `emptyApplication(grantId)` for later phases.

### Storage rules (prepare)

- Private bucket path prefix for grant documents. Upload lands in Phase 02; rules can be written now so Phase 02 does not invent a second home.

### Tests

- Profile / grant / application shapes against the example JSON keys.
- Unknown email cannot read `grants`.

---

## Files (indicative)

- `src/types/grant.ts`
- `src/types/company-profile.ts`
- `src/types/application.ts`
- `src/lib/grants/empty.ts`
- `src/lib/store/grants.ts`
- `src/app/grants/page.tsx`
- `src/app/grants/profile/page.tsx`
- `src/app/grants/find/page.tsx`
- `src/components/app-shell.tsx`
- `firestore.rules`
- `storage.rules`
- `test/grant-contract.test.ts`

---

## Exit criteria

- [ ] Signed-in allow-listed user sees Grants in the sidebar and an empty home
- [ ] Types match the contract keys
- [ ] Firestore rules cover the new collections
- [ ] School contacts, campaigns, and proprietor screens still behave
- [ ] No LLM, search, or Gmail calls from Grants routes

---

## Handoff to Phase 02

Phase 02 needs types, the singleton profile id `termresult`, store helpers, and `/grants/profile`. It must not invent a second profile shape.
