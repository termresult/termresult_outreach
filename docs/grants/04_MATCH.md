# Phase 04 — Match and rank

**Depends on:** Phase 02 profile, Phase 03 catalog.

**Goal:** Every open grant gets an application row with a fit score (or a clear disqualifier). The home and find tables sort Nigeria, then Africa, then global; inside a bucket, sooner deadlines and higher fit rise.

---

## Why this is now

A raw catalog is noise. The operator should see “we can apply” first.

---

## What we build

### Hard filters

Drop to `disqualifiers` (application still exists, status can stay `identified` but hidden from the default list):

- `deadline_at` in the past
- Countries that exclude `NG` and do not say worldwide / Africa
- Explicit “US citizens only”, “EU registered only”, “accredited university only”, “government agency only”, “registered charity only” when the profile is a Nigerian private company

Operator can set `override_eligible` on the grant detail.

### Fit score

- 0–100 from sector tags, stage, traction presence, and eligibility notes.
- Always write `fit_reasons` in plain language.
- Missing profile facts lower the score; they do not invent traction.

### Rank

- Region bucket first (`nigeria` < `africa` < `global` as sort keys).
- Then deadline (nulls last).
- Then fit descending.

### When it runs

- After each discover / ingest.
- “Re-score” button on Find.
- Creating an application row per grant if missing (`id` = `grant_id`).

### UI

- Default Matches filter hides disqualified and closed.
- Columns: funder, title, region, deadline, fit, apply-via.
- Home counts: eligible open, due in 14 days.

### Tests

- Nigerian profile + Africa listing with NG eligible → no disqualifier, region `africa`.
- US-citizens-only listing → disqualified.
- Past deadline → disqualified.
- Sort order: NG before global when scores are equal.

---

## Files (indicative)

- `src/lib/grants/match.ts`
- `src/lib/grants/rank.ts`
- `src/app/api/grants/match/route.ts`
- `src/app/grants/page.tsx`
- `src/app/grants/find/page.tsx`
- `src/lib/store/applications.ts`
- `test/match.test.ts`
- `test/rank.test.ts`

---

## Exit criteria

- [ ] After discover, eligible grants show a score and reasons
- [ ] Hard misses are not in the default list and show why when opened
- [ ] Override puts a miss back on the default list
- [ ] No LLM draft pack yet

---

## Handoff to Phase 05

Phase 05 needs `Application` rows with scores. It writes `pack` and moves status to `drafting` / `ready_for_review`. It must not change filter rules except to read them.
