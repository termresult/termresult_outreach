# TermResult Grants — master plan

**Created:** September 5, 2026  
**Status:** Plan ready; execute phases **in order**.  
**Owners:** TermResult product team

**Product name:** TermResult Grants · **Lives in:** `termresult_outreach`  
**Applicant:** TermResult the company only. Never a school from the outreach list.

**Method:** [PLANNING.md](./PLANNING.md) · **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) · **Contracts:** [GRANT_CONTRACT.md](./GRANT_CONTRACT.md) · **Env:** [ENVIRONMENT.md](./ENVIRONMENT.md) · **Logging:** [LOGGING.md](./LOGGING.md)

---

## 1. What we are building

A **Grants desk** a TermResult teammate opens in Outreach. They keep one company profile (facts + CAC, deck, one-pager). The app **finds** open grants, **ranks** the ones TermResult can actually apply for (Nigeria / Africa first, then global), **drafts** the full pack, and **sends** only when the funder takes email. Portal grants stay a reviewed pack plus a checklist the human submits.

```
Company profile + uploads     (Phase 02, edited anytime)
            │
            ▼
   Discover grants            seed sources + search + paste URL
            │
            ▼
   Match + rank               hard eligibility, then fit score
            │
            ▼
   Draft application pack     answers, cover email, attachment list
            │
     ┌──────┴──────────────┐
     ▼                     ▼
 Email apply            Portal desk
 (Gmail, confirmed)     (copy + mark submitted)
     │                     │
     └──────────┬──────────┘
                ▼
        Application log
   (draft / sent / submitted / won / lost)
```

The operator never sees API keys. They see funder, deadline, fit, apply-via, and a big **Review pack** that asks for confirmation before any email leaves.

---

## 2. Why / key insight

Outreach already knows how to send slow, confirmed Gmail. Grants are a **different audience** (funders, not schools) that can share that pipe.

**Decisions that shape everything:**

- **TermResult only.** The contacts table is out of scope. No “apply on behalf of a school.”
- **Draft everything; send some.** Most grant sites are unique logins and CAPTCHAs. v1 does not drive a browser. Email applications reuse Gmail after a human confirms. Portal applications stop at a ready pack.
- **Hunt both, rank home first.** Nigeria / Africa listings sit above global ones when both are eligible. US-citizens-only and similar hard misses are dropped, not drafted.
- **One profile is the source of truth.** In-app fields plus uploaded docs. Drafts never invent CAC numbers, revenue, or team names that are not in the profile.
- **Hybrid discovery, not a paid US database.** A seed list of known Africa / global sources, a weekly search pass, and “paste this URL.” Operator-added grants are first-class.
- **Confirm before broadcast.** Same Outreach taste: say who we are emailing and what we are attaching.

---

## 3. Scope for v1

**In:**

- Grants section in the existing Outreach shell (same Google allow-list)
- Single TermResult company profile + Firebase Storage uploads
- Grant catalog in Firestore (discovered + pasted + seeded)
- Weekly discover cron + on-demand “Find grants” + ingest-from-URL
- Match / rank with Nigeria–Africa first
- LLM draft pack (cover email, question answers, required-doc checklist)
- Human review, edit, approve
- Email apply through the existing Gmail adapter and throttle
- Portal apply desk: open link, copy answers, mark submitted
- Application statuses and an operator log
- Deadline reminders on the Grants home

**Foundation for later (designed in, not fully built):**

- Browser submit for a specific portal
- Multi-entity profiles (if TermResult ever has a US or UK company)
- Auto-drip follow-ups after submit
- Public grant APIs we do not have keys for yet

---

## 4. Product principles

- **Do not scrape schools or call Maps.** Grants talk to funder pages and a search API only.
- **Do not invent facts.** If the profile is missing a number, the draft leaves a blank the operator must fill.
- **Do not email a funder without confirm.** Test send to the operator first on a new mailbox day if Settings says so.
- **Do not mix grant sends into school campaigns.** Separate application rows. Shared Gmail cap is fine; shared campaign documents are not.
- **Do not auto-submit portals.** No Playwright / CAPTCHA / saved funder passwords in v1.
- **Secrets stay on the server.** Browser talks to our routes; routes talk to search, LLM, Gmail, Storage.
- **Light UI, no jargon.** Buttons say “Find grants”, “Draft pack”, “Send application”, not “enqueue extractor.”
- **Closed grants stay in the catalog** with status `closed` so we do not rediscover them every week.

---

## 5. Tech stack

Same app as Outreach. Pointer: [ARCHITECTURE.md](./ARCHITECTURE.md) and parent [../ARCHITECTURE.md](../ARCHITECTURE.md).

| Piece | Choice | Why | Rejected |
| ----- | ------ | --- | -------- |
| App / auth / data | Existing Next.js + Firebase | Already live; allow-list is enough | New repo, Laravel |
| Files | Firebase Storage | Next to Firestore; private | Putting decks in git |
| Discover | Seed list + search API + URL fetch | Covers Africa + global without a US-only SaaS | Instrumentl / GrantWatch as the spine |
| Extract / draft | Server LLM (Gemini default) | Turns pages and profile into structured packs | Hand-writing every answer |
| Email | Existing Gmail adapter + cron throttle | Already proven for Outreach | A second mailbox product |
| Portal apply | Human + checklist | Portals are not one API | Full auto-submit |

---

## 6. How to use this plan

1. Outreach Phases 01 and 06 must already work (login + Gmail). Grants does not rebuild those.
2. Implement Grants 01 → 07 in order.
3. **Demoable after Phase 05** (profile in, a few grants, a readable draft). **Sendable after Phase 06.**

---

## 7. Phase index

| Phase | Document | In one sentence |
| ----- | -------- | --------------- |
| 01 | [01_FOUNDATION.md](./01_FOUNDATION.md) | Types, Firestore collections, Grants nav, empty pipeline board. |
| 02 | [02_COMPANY_PROFILE.md](./02_COMPANY_PROFILE.md) | TermResult profile form and document uploads. |
| 03 | [03_DISCOVERY.md](./03_DISCOVERY.md) | Seed sources, search, paste-a-URL, weekly scan. |
| 04 | [04_MATCH.md](./04_MATCH.md) | Hard eligibility, fit score, Nigeria/Africa-first rank. |
| 05 | [05_DRAFT.md](./05_DRAFT.md) | LLM application pack from profile + docs + grant. |
| 06 | [06_APPLY.md](./06_APPLY.md) | Review, confirmed Gmail send, portal mark-submitted. |
| 07 | [07_OPERATOR_POLISH.md](./07_OPERATOR_POLISH.md) | Deadlines, counts, safety copy, reports. |

---

## 8. Definition of done

A signed-in teammate can keep the TermResult profile current, run Find grants, see a ranked list, open a draft pack that only uses profile facts, send a confirmed email application, and mark a portal application submitted — each with a readable log — without opening a terminal or seeing a secret.

---

## 9. Out of scope for v1

- Applying as or for any school
- WhatsApp or SMS to funders
- Browser automation / saved funder logins
- Paying for a US grant-database subscription
- Building a Cloud Grant **demo marketing site** (Cloud Grant is just another catalog row if we ingest its URL)
- Multi-tenant SaaS (other companies using this desk)
- Inventing financials or impact numbers the profile does not have
