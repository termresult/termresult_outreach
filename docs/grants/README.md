# TermResult Grants — documentation index

**Created:** September 5, 2026  
**Status:** Plan written; implement Phase 01 next.  
**Owners:** TermResult product team

**What this is:** an **internal Grants desk** inside Outreach so the TermResult team can find funding for **TermResult the company**, draft every application from one company profile, and send the ones that accept email. It is **not** a school-grant product and **not** a school campaign.

**Where this lives:** `termresult_outreach/docs/grants/` plans the feature. Code lands in the existing `termresult_outreach` Next.js app (same Firebase, same allow-list, new `/grants` routes).

School contacts, Prona campaigns, and proprietor installs stay untouched. Grants must not enqueue school WhatsApp or SMS.

---

## How this relates to Outreach

| Surface | Role |
| -------- | ---- |
| Contacts / Campaigns / Logs | School reach. Do not reuse audiences for grants. |
| Gmail adapter + throttle | **Shared pipe** for grant emails that a human confirmed. |
| **Grants (this plan)** | Company profile, discovery, match, draft pack, apply desk. |

---

## How to read this folder

1. Read [PLANNING.md](./PLANNING.md) — method.
2. Read [00_OVERVIEW.md](./00_OVERVIEW.md) — master plan and **phase index**.
3. Skim [GRANT_CONTRACT.md](./GRANT_CONTRACT.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [ENVIRONMENT.md](./ENVIRONMENT.md), [LOGGING.md](./LOGGING.md).
4. Implement **Phase 01 → Phase 07 in order.** Each phase ends with a **Handoff**.

**First useful:** after Phase 05 a teammate can open a matched grant and read a full draft pack. After Phase 06 they can send an email application or mark a portal one submitted.

---

## All documents in this folder

| Doc | Description |
| ---- | ----------- |
| [PLANNING.md](./PLANNING.md) | How we write this plan. |
| [00_OVERVIEW.md](./00_OVERVIEW.md) | Master plan, vision, full **phase index**. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Profile → discover → match → draft → apply. |
| [GRANT_CONTRACT.md](./GRANT_CONTRACT.md) | Company profile, grant, application shapes. |
| [contracts/company-profile.example.json](./contracts/company-profile.example.json) | One company profile. |
| [contracts/grant.example.json](./contracts/grant.example.json) | One grant listing. |
| [contracts/application.example.json](./contracts/application.example.json) | One application row. |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | LLM, search, Storage, inherited Gmail secrets. |
| [LOGGING.md](./LOGGING.md) | Discover / draft / apply events. |
| [01_FOUNDATION.md](./01_FOUNDATION.md) | Types, Firestore, Grants nav, empty board. |
| [02_COMPANY_PROFILE.md](./02_COMPANY_PROFILE.md) | TermResult facts + document uploads. |
| [03_DISCOVERY.md](./03_DISCOVERY.md) | Seed sources, search, paste-a-URL ingest. |
| [04_MATCH.md](./04_MATCH.md) | Eligibility filters and Nigeria/Africa-first rank. |
| [05_DRAFT.md](./05_DRAFT.md) | Application pack from profile + docs + grant rules. |
| [06_APPLY.md](./06_APPLY.md) | Review, email send, portal checklist. |
| [07_OPERATOR_POLISH.md](./07_OPERATOR_POLISH.md) | Deadlines, pipeline, reports. |
