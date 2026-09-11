# Event Attendees Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an authenticated, editable attendee register from the six supplied event sheets.

**Architecture:** Store event-specific records in a dedicated Firestore collection with a matching in-memory test store. Seed a reviewed static transcription, expose authenticated list/update routes, and render a responsive searchable page using the CRM's existing shell and design system.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Firestore, Vitest, Tailwind CSS

## Global Constraints

- Any blue-biro information marks a typed row as `attended`.
- Fully handwritten rows are `attended`.
- Typed rows without handwriting are `did_not_attend`.
- Preserve uncertain source text and mark ambiguity instead of guessing.
- Keep attendee state separate from proprietor follow-up state.

---

### Task 1: Attendee domain and query behavior

**Files:**
- Create: `src/types/attendee.ts`
- Create: `src/lib/attendees/query.ts`
- Test: `test/attendees.test.ts`

**Interfaces:**
- Produces: `Attendee`, `AttendeeInput`, `AttendanceStatus`
- Produces: `parseAttendeeQuery(params)` and `filterAttendees(rows, query)`

- [ ] **Step 1: Write failing query tests**

Test that free-text search matches school, contact, phone, and email; status filtering returns only the selected status; and unsupported status values resolve to all records.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm test test/attendees.test.ts`
Expected: FAIL because attendee domain modules do not exist.

- [ ] **Step 3: Implement the domain and pure query functions**

Define the two literal statuses, record/input types, query parser, and case-insensitive filter.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `pnpm test test/attendees.test.ts`
Expected: PASS.

### Task 2: Reviewed transcription seed

**Files:**
- Create: `src/lib/attendees/seed-data.ts`
- Create: `src/scripts/seed-attendees.ts`
- Modify: `package.json`
- Test: `test/attendees.test.ts`

**Interfaces:**
- Produces: `ATTENDEE_SEED_ROWS: SeedAttendee[]`
- Consumes: `upsertSeedAttendee(row)`

- [ ] **Step 1: Add failing seed integrity tests**

Assert stable IDs are unique, school names are non-empty, every source image is named, both statuses exist, and every fully handwritten entry is attended.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm test test/attendees.test.ts`
Expected: FAIL because seed data does not exist.

- [ ] **Step 3: Transcribe and independently cross-check all six sheets**

Represent each printed row and each unique fully handwritten row once. Record unresolved characters in `transcription_notes`.

- [ ] **Step 4: Add the repeatable seed command**

Add `"seed:attendees": "tsx src/scripts/seed-attendees.ts"` and upsert records without overwriting operator-edited rows.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `pnpm test test/attendees.test.ts`
Expected: PASS.

### Task 3: Persistence and authenticated API

**Files:**
- Create: `src/lib/store/attendees.ts`
- Create: `src/app/api/attendees/route.ts`
- Create: `src/app/api/attendees/[id]/route.ts`
- Modify: `src/lib/store/memory.ts`
- Test: `test/attendees.test.ts`

**Interfaces:**
- Produces: `listAttendees()`, `updateAttendee(id, input, actor)`, `upsertSeedAttendee(row)`
- API: `GET /api/attendees`, `PATCH /api/attendees/:id`

- [ ] **Step 1: Write failing store tests**

Cover ordered listing, successful edits, unknown IDs, missing school names, and invalid statuses using the memory store.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm test test/attendees.test.ts`
Expected: FAIL because the attendee store does not exist.

- [ ] **Step 3: Implement memory and Firestore persistence**

Normalize editable values, preserve stable IDs/source metadata, and return plain status-bearing errors.

- [ ] **Step 4: Add authenticated GET and PATCH handlers**

Use `getSessionUser()` and map domain errors to JSON responses.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `pnpm test test/attendees.test.ts`
Expected: PASS.

### Task 4: Responsive editable attendee page

**Files:**
- Create: `src/app/attendees/page.tsx`
- Create: `src/app/attendees/attendees-board.tsx`
- Modify: `src/components/app-shell.tsx`

**Interfaces:**
- Consumes: `listAttendees()` and `filterAttendees()`
- Consumes API: `PATCH /api/attendees/:id`

- [ ] **Step 1: Add the authenticated server page**

Load records, parse URL filters, and render totals plus the client board.

- [ ] **Step 2: Build responsive list and editing**

Render phone cards and desktop table, status badges, search/status controls, ambiguity notes, and an accessible edit dialog.

- [ ] **Step 3: Add Attendees navigation**

Add `/attendees` with an appropriate icon and correct active-route behavior.

- [ ] **Step 4: Verify types and lint**

Run: `pnpm lint`
Expected: exit 0.

### Task 5: Full verification

**Files:**
- Verify all changed files

- [ ] **Step 1: Run all tests**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `pnpm build`
Expected: Next.js build exits 0 and includes `/attendees` plus attendee API routes.

- [ ] **Step 3: Browser-check the page**

Confirm desktop/mobile rendering, search, status filtering, opening an editor, saving changes, and clear error display.

- [ ] **Step 4: Review the final diff**

Confirm the six source HEIC files remain untouched and no generated image conversions were added to git.
