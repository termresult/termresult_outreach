# Task 3 Report: Attendee Persistence and Authenticated API

## Result

Implemented a dedicated attendee store backed by the in-memory test store or the `event_attendees` Firestore collection. Added authenticated list and update routes, completed the Task 2 seed contract, and kept attendee state independent from proprietor state.

## TDD Evidence

### Initial RED

Command:

`pnpm test test/attendees.test.ts`

Observed:

- Exit code: 1
- Failed suite: `test/attendees.test.ts`
- Error: `Cannot find module '@/lib/store/attendees'`
- This was the expected failure because the attendee store did not exist.

### Validation RED

After adding a focused null-school-name case:

`pnpm test test/attendees.test.ts`

Observed:

- Exit code: 1
- 20 tests run: 19 passed, 1 failed
- The store threw a `TypeError` for a null school name instead of the required status-bearing 400 domain error.

### GREEN

Focused command:

`pnpm test test/attendees.test.ts`

Observed:

- Exit code: 0
- 1 test file passed
- 20 tests passed

Full regression command:

`pnpm test`

Observed:

- Exit code: 0
- 9 test files passed
- 57 tests passed

Lint command:

`pnpm exec eslint test/attendees.test.ts src/lib/store/attendees.ts src/lib/store/memory.ts src/app/api/attendees/route.ts 'src/app/api/attendees/[id]/route.ts' src/scripts/seed-attendees.ts`

Observed:

- Exit code: 0
- No lint findings

Production build:

`pnpm build`

Observed:

- Exit code: 0
- Next.js 16.3.1 compiled successfully and completed TypeScript and static page generation.
- The route manifest includes `/api/attendees` and `/api/attendees/[id]`.

## Files

- Created `src/lib/store/attendees.ts`
  - Memory and Firestore persistence in the dedicated `event_attendees` collection.
  - Ordered listing with printed serials first and handwritten records ordered by school.
  - Validated updates with normalization and plain status-bearing `AttendeeError` failures.
  - Create-only seed upserts that preserve every existing record unchanged.
- Created `src/app/api/attendees/route.ts`
  - Authenticated `GET /api/attendees`.
- Created `src/app/api/attendees/[id]/route.ts`
  - Authenticated `PATCH /api/attendees/:id`.
  - Awaits the Next.js 16 Promise-valued route params.
  - Maps attendee domain failures to plain JSON errors and HTTP statuses.
- Modified `src/lib/store/memory.ts`
  - Added a separate attendee record map and reset support.
- Modified `test/attendees.test.ts`
  - Added focused attendee store coverage.
- Added `.superpowers/sdd/task-3-report.md`.

## Interfaces

- `listAttendees(): Promise<Attendee[]>`
- `updateAttendee(id, input, actor): Promise<Attendee>`
- `upsertSeedAttendee(row): Promise<{ attendee: Attendee; created: boolean }>`
- `GET /api/attendees` returns `{ attendees }` after authentication.
- `PATCH /api/attendees/:id` returns `{ attendee }` after authentication and validation.

## Behavior Covered

- Stable ordering.
- Successful field edits.
- Trimming nullable editable strings.
- Lowercasing trimmed emails.
- Preserving phone transcription without adding or changing digits.
- Preserving IDs, source images, serials, and creation timestamps on edits.
- 404 errors for unknown IDs.
- 400 errors for missing school names, invalid statuses, and missing operator names.
- Create-only seed behavior that preserves operator edits during reseeding.
- Resetting attendee memory independently from proprietor memory.

## Self-review

- Confirmed the attendee store has no dependency on proprietor state.
- Confirmed Firestore seed creation is transactional, so concurrent reseeds cannot overwrite an existing record.
- Confirmed editable updates cannot replace stable source metadata.
- Confirmed only the exact `attended` and `did_not_attend` status values are accepted.
- Confirmed API handlers authenticate before reading request data or touching persistence.
- Confirmed the dynamic route awaits `ctx.params` according to the installed Next.js 16 convention already used by the repository.
- Confirmed the untracked source HEIC files and pre-existing Task 2 report modification were not included in Task 3 staging.
- Confirmed `git diff --check`, focused tests, full tests, lint, and production build pass before commit.

## Commit

The Task 3 files and this report are committed together in the Task 3 implementation commit. The final commit hash is returned with the task result.

## Concerns

None.

## Review Follow-up: PATCH Route Boundaries

### Root cause

The PATCH handler cast `request.json()` directly to the expected TypeScript shape before entering its domain-error boundary. Runtime JSON values therefore bypassed compile-time assumptions: malformed JSON leaked a `SyntaxError`, null leaked a property-access `TypeError`, and non-string fields reached string normalization methods and leaked `TypeError`.

### RED

Command:

`pnpm test test/attendees-route.test.ts`

Observed:

- Exit code: 1
- 1 test file failed
- 16 tests ran: 2 passed and 14 failed
- Malformed JSON leaked `SyntaxError: Expected property name or '}' in JSON at position 1`.
- Null bodies leaked `TypeError: Cannot read properties of null (reading 'operator_name')`.
- Non-string operator names leaked `TypeError: actor.trim is not a function`.
- Non-string editable values leaked `TypeError: value?.trim is not a function` or produced inconsistent domain messages.
- The already-valid authenticated 404 mapping and authenticate-before-parse behavior passed.

### GREEN

First focused GREEN command:

`pnpm test test/attendees-route.test.ts`

Observed:

- Exit code: 0
- 1 test file passed
- 16 tests passed

Final focused command:

`pnpm test test/attendees-route.test.ts test/attendees.test.ts`

Observed:

- Exit code: 0
- 2 test files passed
- 36 tests passed

Final full command:

`pnpm test`

Observed:

- Exit code: 0
- 10 test files passed
- 73 tests passed

Lint command:

`pnpm exec eslint test/attendees-route.test.ts src/lib/attendees/update-input.ts 'src/app/api/attendees/[id]/route.ts'`

Observed:

- Exit code: 0
- No lint findings

Build command:

`pnpm build`

Observed:

- Exit code: 0
- Next.js 16.3.1 compiled successfully.
- TypeScript completed successfully.
- The route manifest includes `/api/attendees/[id]`.

### Review changes

- Added `test/attendees-route.test.ts` with direct PATCH boundary coverage for malformed JSON, null and non-object bodies, non-string operator names, every editable field's runtime shape, authenticated domain-error mapping, and authentication before body parsing.
- Added `src/lib/attendees/update-input.ts`, a dependency-free runtime parser that returns the existing store input and actor contracts or throws status-bearing attendee domain errors.
- Updated `src/app/api/attendees/[id]/route.ts` to catch JSON decoding failures and map all parser and store domain errors to consistent plain JSON responses.
- Preserved `listAttendees`, `updateAttendee`, and `upsertSeedAttendee` contracts unchanged.

### Follow-up concerns

None.
