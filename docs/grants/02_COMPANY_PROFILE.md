# Phase 02 — Company profile

**Depends on:** Phase 01 types and `/grants/profile`. Firebase Storage enabled on the Outreach project.

**Goal:** The operator can keep TermResult’s facts and files in one place. Everything later (match, draft, attach) reads this document only.

---

## Why this is now

Drafts that invent CAC numbers or school counts will get us rejected. The profile is the brake.

---

## What we build

### Profile form

- Fields from the contract: legal and trading name, city, entity type, CAC, TIN, founded year, website, email, phone, one-liner, problem, solution, stage, sector tags, traction numbers, team rows.
- Save writes the singleton. Empty numbers stay null, not zero, unless the operator typed zero.
- Home shows “Profile incomplete” until legal name, one-liner, country, and email are set.

### Documents

- Upload kinds: CAC, deck, one-pager, financials, other.
- Store in Firebase Storage under a grants/profile prefix. Persist `storage_path` on the profile.
- List, replace, delete. Do not commit files to git.

### Tests

- Save round-trip of the example profile keys.
- Upload rejected when over `GRANT_DOC_MAX_BYTES`.

---

## Files (indicative)

- `src/app/grants/profile/page.tsx`
- `src/app/grants/profile/profile-form.tsx`
- `src/app/api/grants/profile/route.ts`
- `src/app/api/grants/profile/documents/route.ts`
- `src/lib/store/company-profile.ts`
- `src/lib/grants/documents.ts`
- `test/company-profile.test.ts`

---

## Exit criteria

- [ ] Operator can edit and reload the profile
- [ ] A deck (or other kind) can be uploaded and listed
- [ ] Missing CAC stays null and is visible as “not on file”
- [ ] No discover or draft yet

---

## Handoff to Phase 03

Phase 03 needs a readable profile (even if some fields are still null) and must not write grant facts onto the profile document.
