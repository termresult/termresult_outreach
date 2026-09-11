# Event Attendees Design

**Date:** 2026-09-11
**Status:** Approved for immediate implementation

## Goal

Add an authenticated, editable CRM page that records every school on the supplied event sheets and clearly separates schools that attended from schools that did not.

## Attendance rule

- A typed school with any information added in blue biro is **Attended**.
- Every fully handwritten school entry is **Attended**.
- A typed school whose row has no handwritten information is **Did not attend**.
- Printed contact information remains visible for did-not-attend schools.
- Ambiguous handwriting must not be silently guessed. The stored value should preserve the most defensible transcription and include a verification note when a character cannot be resolved from the scan.

## Data model

Use a dedicated `event_attendees` Firestore collection, with the in-memory store used by tests. Each record contains:

- stable source ID and optional printed serial number
- contact/person name
- school name
- phone
- email
- attendance status (`attended` or `did_not_attend`)
- source image name
- transcription notes
- timestamps and last editor

The event records remain separate from proprietor follow-up records because event attendance and sales-conversation state have different meanings and lifecycles.

## Data ingestion

Commit a typed seed dataset transcribed from all six supplied sheets. A repeatable seed script upserts by stable source ID, preserving later operator edits. Duplicate photographic overlap must not create duplicate rows.

## Page and interaction design

Add **Attendees** to the main navigation and serve the page at `/attendees`.

The page includes:

- summary cards for all schools, attended schools, and did-not-attend schools
- search across school, contact, phone, and email
- status filter for all, attended, and did not attend
- a responsive card layout on phones and table layout on larger screens
- a status badge on every record
- an edit control that opens a focused form for correcting all fields and changing attendance status
- clear placeholders for missing contact data
- a visible note when a transcription needs manual verification

Edits save through authenticated API routes and update the page without requiring terminal access.

## Validation and errors

- School name is required.
- Attendance status must be one of the two supported values.
- Email is trimmed and lowercased but otherwise preserved when handwritten formatting is uncertain.
- Phone numbers are trimmed and preserved as transcribed rather than inventing missing digits.
- API errors appear in plain language in the edit form.

## Verification

- Unit tests cover attendance filtering, searching, validation, and seed uniqueness.
- Store tests cover list, update, invalid status, and unknown record behavior.
- Run the complete Vitest suite, ESLint, and the Next.js production build.
- Browser-check the authenticated desktop and mobile attendee views when the local auth configuration permits it.
