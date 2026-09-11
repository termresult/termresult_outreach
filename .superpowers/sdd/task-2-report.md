# Task 2 Report: Reviewed Attendee Seed

## Result

Implemented the reviewed attendee seed dataset, integrity tests, and the Task 3-ready seed command. The seed contains every authoritative printed serial 1–104 exactly once and 17 unique fully handwritten records, for 121 total records: 64 attended and 57 did not attend.

## TDD Evidence

### RED

Command:

`pnpm test test/attendees.test.ts`

Observed result:

- Exit code: 1
- Failed suite: `test/attendees.test.ts`
- Failure: `Cannot find module '@/lib/attendees/seed-data'`
- This was the expected failure because the seed module had not yet been implemented.

### GREEN

Focused command:

`pnpm test test/attendees.test.ts`

Observed result:

- Exit code: 0
- 1 test file passed
- 9 tests passed at the first GREEN run
- After adding reviewed count locks, the attendee file passes 10 tests.

Full regression command:

`pnpm test`

Observed result:

- Exit code: 0
- 9 test files passed
- 47 tests passed

Lint command:

`pnpm exec eslint test/attendees.test.ts src/lib/attendees/seed-data.ts src/scripts/seed-attendees.ts`

Observed result:

- Exit code: 0
- No lint findings

`git diff --check` also passed with no whitespace errors. IDE diagnostics reported no errors in the changed TypeScript files.

## Files

- Created `src/lib/attendees/seed-data.ts`
  - Defines `SeedAttendee`.
  - Exports `ATTENDEE_SEED_ROWS`.
  - Builds printed rows from the authoritative `REGISTRATION_ROWS`.
  - Adds reviewed handwritten records and transcription notes.
- Created `src/scripts/seed-attendees.ts`
  - Loads `.env.local`.
  - Calls the Task 3 contract `upsertSeedAttendee(row)`.
  - Reports created and preserved-existing totals.
- Modified `package.json`
  - Added `seed:attendees`.
- Modified `test/attendees.test.ts`
  - Added unique ID, school name, source image, status, handwritten attendance, printed serial coverage, and reviewed total checks.

## Data Counts

### Attendance status

- Total: 121
- Attended: 64
- Did not attend: 57

### Source kind

- Printed source records: 104
- Unique fully handwritten source records: 17

### Primary source image

- `IMG_6769.HEIC`: 35
- `IMG_6770.HEIC`: 36 (35 printed plus the handwritten Creme Quintessence entry)
- `IMG_6771.HEIC`: 34
- `IMG_6772.HEIC`: 10 unique handwritten records
- `IMG_6773.HEIC`: 3 unique handwritten extension records; the photograph also overlaps `IMG_6772` in part
- `IMG_6774.HEIC`: 3 unique handwritten records

Secondary source images for merged handwriting are recorded in `transcription_notes`, while `source_image` remains the printed record's primary image.

## Merge and Overlap Decisions

- Merged handwritten Gracious Grace School into printed serial 1.
- Merged handwritten De-Precious Trust Academy into printed serial 21.
- Merged handwritten Unique School into printed serial 99.
- Merged handwritten Divine Victorious Leaders Academy into printed serial 104.
- Treated the overlapping portion of `IMG_6773` as photographic overlap with `IMG_6772`, while retaining its three unique extension rows as separate handwritten records.
- Retained the handwritten Creme Quintessence row independently despite its handwritten “71” because printed serial 71 is a different school.

## Ambiguity Handling

- No `[unclear: ...]` marker is stored in a phone or email field.
- Complete printed phones remain the primary phone for printed records.
- Clear handwritten contacts are used where available.
- Cropped email endings, uncertain local parts, overwritten contacts, invalid-length phone text, and alternate addresses are retained in `transcription_notes`.
- Ambiguous values are `null` when storing a partial string would create a fake contact value.
- The Terrigem Royal contact name and contacts remain null because the writing is overwritten; trustworthy fragments are preserved in notes.
- The Meganiel Academy phone is null because the visible number has only ten digits; the visible text is preserved in notes.
- Additional clear/partial details on merged schools are preserved in the printed record's notes.

## Self-review

- Confirmed serials 1–104 are ordered and represented exactly once.
- Confirmed all IDs are stable and unique.
- Confirmed every fully handwritten source record is attended.
- Confirmed both attendance statuses are present and count-locked.
- Confirmed all school names are non-empty.
- Confirmed the authoritative registration list supplies all printed names, schools, and phones.
- Confirmed the original untracked HEIC scans were not modified or staged.
- Confirmed the seed script does not create a persistence implementation parallel to Task 3.

## Commit

All Task 2 code, tests, package command, and this report are committed together in the Task 2 implementation commit. The final commit hash is returned with the task result.

## Concerns

- The seed command intentionally cannot execute until Task 3 provides `src/lib/store/attendees.ts` with `upsertSeedAttendee(row)`. This is the explicit integration seam requested by the brief.
- Several source contacts remain uncertain due to cropping or overwritten handwriting; those cases are preserved in `transcription_notes` rather than guessed.

## Review Correction: IMG_6773 Extension Rows

The Task 2 review identified that `IMG_6773` contains three unique handwritten records in addition to its overlap with `IMG_6772`. Added all three as attended records:

- `handwritten-catering-model`: Akiri Joy A., Catering Model Academy. Phone and email are null. Notes preserve the Catering/Cathering ambiguity and partial overwritten `akirijoy…@gmail…` email.
- `handwritten-noble-kiddies`: Ijeoma Kalu, Noble Kiddies Academy. Primary phone is `+2348034783207`; email is null. Notes preserve partial ambiguous `ljoyu@gmail.co…`.
- `handwritten-aggs-apo`: Emagborom Magdalene Msember, AGGS, Apo. Phone and email are null. Notes preserve partial `080360581…` and `dooshimamsember@…`.

Foundation of Success remains a distinct handwritten record. Its notes now identify printed serial 47 as a possible duplicate while documenting why a merge is unsafe: different contact, no matching phone, and no matching location.

### Correction TDD evidence

RED command:

`pnpm test test/attendees.test.ts`

Observed RED:

- Exit code: 1
- 12 tests run: 8 passed, 4 failed
- Failures explicitly showed the missing `IMG_6773.HEIC` source, three missing handwritten IDs, stale 118-row total, and absent extension-row objects.

GREEN focused command:

`pnpm test test/attendees.test.ts`

Observed GREEN:

- Exit code: 0
- 1 test file passed
- 12 tests passed

GREEN full command:

`pnpm test`

Observed GREEN:

- Exit code: 0
- 9 test files passed
- 49 tests passed

Lint command:

`pnpm exec eslint test/attendees.test.ts src/lib/attendees/seed-data.ts`

Observed lint result:

- Exit code: 0
- No lint findings

### Strengthened integrity coverage

- Exact set of 17 stable handwritten IDs.
- Exact supported source-image set covering `IMG_6769.HEIC` through `IMG_6774.HEIC`.
- Explicit attended decisions for printed serials 1, 6, 21, 68, 72, 99, and 104.
- Explicit did-not-attend decisions for printed serials 2, 16, 40, 71, and 101.
- Exact `IMG_6773` extension row names, schools, contact fields, and attended statuses.
- Guard against cropped ellipses or bracket markers appearing in phone/email fields.

### Corrected data counts

- Total: 121
- Attended: 64
- Did not attend: 57
- Printed source records: 104
- Unique fully handwritten source records: 17
- `IMG_6773.HEIC` primary source records: 3

### Correction concerns

- Cropped `IMG_6773` contacts remain intentionally null where no complete value is supported; all trustworthy partial text is retained in `transcription_notes`.
- The Task 3 store integration seam remains intentionally unresolved until Task 3 supplies `upsertSeedAttendee`.
