# Phase 07 — Operator polish

**Depends on:** Phases 01–06 working on a preview URL.

**Goal:** A non-engineer can run the desk every week: see what is due, what was sent, and what still needs a human — without reading logs in Vercel.

---

## Why this is last

The machine exists. This phase is taste, reminders, and trust.

---

## What we build

### Home

- Counts: open matches, packs needing blanks, due in 14 days, sent this month, portal in flight.
- List of three soonest deadlines with a link to the grant.
- Last discover time and a one-line result.

### Deadlines

- Daily cron (or the existing email tick’s cousin) writes `grants.deadline.warn` for 14-day and 3-day open applications that are not submitted.
- Home and grant detail show a plain-language due banner.

### Log

- `/grants` tab or `/grants/log`: filter by status and apply-via.
- One-line errors. No secrets.
- Optional CSV of the application list.

### Copy and empty states

- Profile empty: “Add the company facts first.”
- Catalog empty: “Paste a grant URL or hit Find grants.”
- Search key missing: “Find grants will only refresh pages we already have. Paste a URL still works.”

### Settings

- Test grant email, “force test address” flag, optional Grants daily cap.
- Keys stay in Vercel, not the form.

### Tests

- Deadline banner appears for an application due in three days and not submitted.
- CSV columns match contract keys we show the operator.

---

## Files (indicative)

- `src/app/grants/page.tsx`
- `src/app/grants/log/page.tsx`
- `src/app/api/cron/grants-deadlines/route.ts`
- `src/lib/grants/deadlines.ts`
- `src/app/settings/settings-form.tsx`
- `test/deadlines.test.ts`

---

## Exit criteria

- [ ] Home is usable as the weekly starting point
- [ ] Due grants are obvious without opening every row
- [ ] Settings test email is respected on the apply confirm screen
- [ ] Parent definition of done in [00_OVERVIEW.md](./00_OVERVIEW.md) is true

---

## Handoff after v1

Later work (not this phase): one portal’s browser submit, a second legal entity, follow-up drips, paid grant databases.
