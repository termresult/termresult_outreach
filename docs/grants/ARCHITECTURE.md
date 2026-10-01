# Architecture — TermResult Grants

**Created:** September 5, 2026  
**Status:** Active  
**Related:** [00_OVERVIEW.md](./00_OVERVIEW.md) · [GRANT_CONTRACT.md](./GRANT_CONTRACT.md) · [ENVIRONMENT.md](./ENVIRONMENT.md) · parent [../ARCHITECTURE.md](../ARCHITECTURE.md)

---

## 1. System shape

```
Browser (TermResult operator)
      │
      ▼
Next.js on Vercel  —  /grants  /grants/profile  /grants/[id]
  Server routes / server actions
      │
      ├── Firebase Auth (same allow-list)
      ├── Firestore (profile, sources, grants, applications)
      ├── Firebase Storage (company documents)
      ├── Search API (discovery queries)
      ├── LLM (extract grant + draft pack)
      └── Gmail adapter (existing) + email tick cron
```

School Discovery, contacts import, Twilio, and Termii stay **outside** this feature.

---

## 2. Four jobs, one model

| Job | Who | When |
| --- | --- | --- |
| **Profile** | Operator edits facts and uploads files | Rare, then keep current |
| **Discover** | Cron weekly, or operator hits Find grants / paste URL | Weekly + on demand |
| **Match + draft** | Server, after new or updated grants | On discover, or when operator opens Draft |
| **Apply** | Operator confirms; server sends email or records portal submit | Per grant |

The **application** row is the unit of work: one grant × TermResult. Status moves `identified → drafting → ready_for_review → approved → queued_email → submitted_email` or `ready_for_portal → submitted_portal`, then `won | lost | skipped`. Email reuse of the Gmail adapter gets an idempotency key so a Vercel retry does not double-send.

---

## 3. Discovery (hybrid)

Three intakes, one `Grant` shape:

1. **Seed sources** — a coded list of known homepages and search queries (NITDA, SMEDAN, Tony Elumelu, Mastercard Foundation, Google for Startups, Microsoft for Startups, AWS Activate, Cloud Grant, and similar). Seeds are not grants; they are places we look.
2. **Search pass** — a server search API runs a small fixed query set (edtech / education SaaS / Nigeria / Africa / startup grant, current year). Results are URLs. The LLM extracts a `Grant` or discards junk.
3. **Paste URL** — operator pastes a page. Fetch + extract. This is how one-off corporates and WhatsApp rumours enter the catalog.

Dedup on `canonical_url` (normalised). If the same funder posts a new cycle, it is a new grant when the deadline or URL cycle slug changes; otherwise update the existing row.

No headless browser in v1. If a page is login-walled, the grant is stored as `needs_human` with the URL and a note.

---

## 4. Match

Hard filters first (drop, do not draft):

- Deadline already passed (unless the operator unsnoozes)
- Country / citizenship rules that exclude a Nigerian company with no US/EU entity
- Applicant type that is only government, only accredited university, or only non-profit when our profile is a private company and the page is explicit

Then a fit score (0–100) from profile sector, stage, traction, and the grant’s stated themes. **Rank:** region bucket (`nigeria` then `africa` then `global`), then sooner deadline, then higher fit.

Match writes `fit_score`, `fit_reasons`, and `disqualifiers` onto the application (or a proposed application). Disqualified grants remain visible behind a “Not a fit” filter so the operator can override.

---

## 5. Draft

The draft function receives: company profile, extracted text from uploaded docs (names and facts already on the profile win if they conflict), and the grant’s questions / eligibility notes.

It produces:

- Email subject + cover body (for `apply_via` email or either)
- Structured answers keyed by the grant’s `required_fields`
- Attachment checklist (which profile documents to include)
- Blanks tagged `needs_operator` when a fact is missing

The operator can edit every field. Re-draft replaces the pack but keeps status and send history.

---

## 6. Apply

**Email path** (`apply_via` is `email` or `either` and the operator chose email):

- Confirm screen: funder, To address, subject, attachments, “this is the real send”
- Enqueue one outbound using the existing Gmail send helper and the same daily cap / gap as school email, or a Grants-specific cap in Settings if we need to protect school campaigns that day
- Application status follows the message row

**Portal path:**

- Pack on the left, checklist on the right, “Open application page” in a new tab
- Operator ticks items, pastes a confirmation URL, marks submitted
- No password store

---

## 7. Why this stays in Outreach

The teammate already lives here. Gmail OAuth is done. A second app would split login and the send log. Grants is a new nav group, not a new Firebase project.

---

## 8. UI surfaces

- **Grants home** — counts: open matches, drafts ready, due in 14 days, sent this month
- **Find** — last scan time, Find grants button, paste URL
- **Matches** — ranked table: funder, title, region, deadline, fit, apply-via
- **Grant detail** — listing facts + application pack + apply actions
- **Profile** — company form + document list
- **Grant log** — filter by status (can live as a tab on home in Phase 07)

Reuse `AppShell`, `PageHeader`, `StatCard`, and the existing light internal-tool look.

---

## 9. Design intent (implement at build time)

Internal tool, light background, no gradients, one accent colour, large readable table, user-friendly copy. Same family as the rest of Outreach. Actual components and strings are chosen in implementation, not here.
