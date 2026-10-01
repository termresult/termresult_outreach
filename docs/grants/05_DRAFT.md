# Phase 05 — Draft pack

**Depends on:** Phase 02 profile + documents, Phase 04 applications. `GEMINI_API_KEY`.

**Goal:** One button produces a reviewable pack: cover email, answers for `required_fields`, attachment list. Facts come only from the profile and uploaded docs. First useful milestone.

---

## Why this is now

Finding is useless if the operator still stares at a blank form. The draft is the time save. Sending waits for Phase 06.

---

## What we build

### Draft function

- Inputs: `CompanyProfile`, grant `required_fields` and notes, optional extracted text from uploaded docs.
- Outputs: `pack` on the application (subject, cover_email, answers, attachment_kinds, needs_operator).
- If `cac_rc`, traction counts, or team are missing, those answers are blank with `needs_operator: true`.
- Do not invent bank details, revenue, or impact percentages.
- Re-draft overwrites pack text, not `message_id` or submit timestamps.

### Document text

- For uploaded PDFs / text-like files we already have, pull a short extract for the model. If extract fails, still draft from profile fields and say so.

### UI

- Grant detail: **Draft pack** / **Re-draft**.
- Editable subject, cover, and each answer.
- Checklist of which profile documents would attach.
- Banner when `needs_operator` is true: “Fill the highlighted blanks before send.”
- Status moves `identified → drafting → ready_for_review` when save succeeds.

### Tests

- Fixture profile with null CAC → answer that needs CAC is flagged, text empty.
- Fixture profile with one-liner → summary answer contains that idea, not a made-up school count.
- Re-draft does not clear `submitted_at`.

---

## Files (indicative)

- `src/lib/grants/draft.ts`
- `src/lib/grants/llm.ts`
- `src/lib/grants/doc-text.ts`
- `src/app/api/grants/[id]/draft/route.ts`
- `src/app/grants/[id]/page.tsx`
- `src/app/grants/[id]/pack-editor.tsx`
- `test/draft-facts.test.ts`

---

## Exit criteria

- [ ] Operator can draft and edit a pack on an eligible grant
- [ ] Missing facts are blanks, not guesses
- [ ] Home can count “ready for review”
- [ ] No email leaves the building

---

## Handoff to Phase 06

Phase 06 needs a saved `pack` and `apply_via`. It adds confirm + Gmail + portal mark-submitted. It must not silently re-draft on send.
