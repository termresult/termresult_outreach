# Phase 03 — Discovery

**Depends on:** Phase 01 grant types and store. Search and LLM keys from [ENVIRONMENT.md](./ENVIRONMENT.md) for the full path; paste-URL must work with LLM only.

**Goal:** Fill the catalog. The operator can paste a grant URL, hit Find grants, and trust a weekly cron to look again. Listings are stored as `Grant` rows. No ranking UI yet beyond “newest” / “open.”

---

## Why this is now

Match and draft need real rows. A hand-typed spreadsheet will die the second week. Hybrid intake (seed + search + paste) is the whole finder.

---

## What we build

### Seed sources

- A coded list of `GrantSource` rows: Nigeria / Africa first (NITDA, SMEDAN, Tony Elumelu, similar), then global (Google for Startups, Microsoft for Startups, AWS Activate, Cloud Grant, similar).
- Each source has `intake`, `homepage` and/or `query`, `region_bias`, `enabled`.
- A seed script or first-run upsert. Do not scrape Maps. Do not invent application emails.

### Paste URL

- Form on `/grants/find`: URL in, Grant out.
- Fetch the page on the server. LLM extracts contract fields. Operator can edit before save.
- Dedup on `canonical_url`. Login-walled pages become `listing_status: needs_human`.

### Find grants

- Button runs enabled sources: seed search queries through the search API, then extract candidates.
- Cap the number of URLs per run so we do not burn the LLM key.
- Discard obvious non-grants (news comments, job ads) rather than storing them.

### Cron

- Weekly route with `CRON_SECRET` (same header taste as email tick).
- Logs `grants.discover.start` / `end`.
- If search key is missing, cron still re-fetches known open grant URLs to refresh deadlines.

### Catalog UI

- `/grants/find` shows last run, created/updated counts, and the raw catalog table.
- Opening a row goes to `/grants/[id]` with listing fields only (pack comes in Phase 05).

### Tests

- Canonical URL strips tracking query and trailing slash.
- Dedup updates the existing grant instead of inserting a second.
- Extracted example HTML/fixture becomes the example grant keys (fixture in test, not a live network call).

---

## Files (indicative)

- `src/lib/grants/sources.ts`
- `src/lib/grants/canonical-url.ts`
- `src/lib/grants/extract.ts`
- `src/lib/grants/discover.ts`
- `src/lib/grants/search.ts`
- `src/app/grants/find/page.tsx`
- `src/app/grants/find/find-form.tsx`
- `src/app/grants/[id]/page.tsx`
- `src/app/api/grants/ingest/route.ts`
- `src/app/api/grants/discover/route.ts`
- `src/app/api/cron/grants-discover/route.ts`
- `src/scripts/seed-grant-sources.ts`
- `test/canonical-url.test.ts`
- `test/extract-grant.test.ts`
- `test/discover-dedup.test.ts`

---

## Exit criteria

- [ ] Paste a public grant page and get a saved Grant with title, funder, url, apply_via when the page states them
- [ ] Find grants with search configured creates or updates rows and logs counts
- [ ] Weekly cron route rejects requests without the cron secret
- [ ] Duplicate URL does not create a second grant
- [ ] No match score and no Gmail send

---

## Handoff to Phase 04

Phase 04 needs a catalog of `Grant` documents and must not change how pages are fetched. It only scores and ranks.
