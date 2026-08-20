# Phase 02 — Contacts

**Depends on:** Phase 01. Discovery files already on disk: `termresult_school_discovery/data/runs/abuja-fct-20260817T162901Z/contacts-live.csv` and `records.json`. [CONTACT_CONTRACT.md](./CONTACT_CONTRACT.md) import mapping.

**Goal:** A non-technical person can upload the scrape and browse / filter schools. Phones and emails are cleaned. WhatsApp, SMS, and email “can send” flags are set. No messages go out.

---

## Why this is now

Campaigns need a real audience. Import once, keep send history forever.

---

## What we build

### Import

- `/import` accepts `contacts-live.csv` **or** `records.json`.
- Map fields per the contract. Drop junk emails. Normalise phones to E.164 (`+234…`).
- Upsert on `source_place_id`. Update name/phone/email/website/owner. Never delete `messages`.
- End screen: created / updated / skipped / invalid, plus how many have phone vs email.

### Contacts UI

- Search by name.
- Filters: has phone, has email, area, source (maps vs directory).
- Columns: name, area, phone, email, WhatsApp/SMS/email ticks.
- Click a row: full contact, website link, raw phones.

### Lists (light)

- Optional saved list: “AMAC phones”, “has email”. Can be a stored filter, not a copied pile of ids, as long as the campaign freezes the matching ids at confirm time (Phase 03).

### Tests

- Normalise a Nigerian national number to E.164.
- Reject `john@doe.com` and `your.address@email.com`.
- Upsert does not wipe a fake message row in a unit/integration test of the import function.

---

## Files (indicative)

- `src/app/import/page.tsx`
- `src/app/contacts/page.tsx`
- `src/app/contacts/[id]/page.tsx`
- `src/lib/import/from-csv.ts`
- `src/lib/import/from-records.ts`
- `src/lib/phones/e164.ts`
- `src/lib/email/clean.ts`
- `src/app/api/import/route.ts` (or a server action)
- `test/e164.test.ts`
- `test/import-clean.test.ts`

---

## Exit criteria

- [ ] Operator uploads the FCT CSV (or JSON) on the preview URL and sees ~5.5k contacts
- [ ] Phone/email counts are in the same ballpark as the scrape (thousands of phones, hundreds of emails) — not zero, not duplicated 2×
- [ ] Filters work without a page crash
- [ ] Re-import of the same file updates, does not duplicate
- [ ] Still no provider sends

---

## Handoff to Phase 03

Phase 03 needs queryable contacts with `channels.*` flags. It will create campaigns and a queue. It must not re-parse `records.json` itself.
