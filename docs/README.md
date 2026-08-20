# TermResult Outreach — documentation index

**Created:** August 20, 2026  
**Status:** Plan written; implement Phase 01 next.  
**Owners:** TermResult product team

**What this is:** a **simple Next.js app** (Vercel) so a non-technical teammate can message FCT schools we already scraped — WhatsApp first, then bulk SMS, then personalised Gmail. Contacts live in a **new Firebase project** under the TermResult Google account.

**Where this lives:** `termresult_outreach/` is its own app beside `termresult_school_discovery`, `termresults_schools`, `termresultwebsite`, and `termresultbackend`.

**Scraping is done.** Do not re-run Maps discovery from this app. Import the existing run (`contacts-live.csv` / `records.json`).

---

## How this relates to the rest of TermResult

| Product | Role |
| -------- | ---- |
| `termresult_school_discovery` | Already built: market map + phones / emails / websites |
| **Outreach (this repo)** | Operator app: import those contacts, send campaigns |
| `termresults_schools` (School Finder) | Public parent directory of **customer** schools only |
| `termresultwebsite` | Marketing + school portals |

v1 does **not** publish outreach lists to School Finder. It does **not** scrape Google again.

---

## How to read this folder

1. Read [PLANNING.md](./PLANNING.md) — how we write plans.
2. Read [00_OVERVIEW.md](./00_OVERVIEW.md) — master plan and **phase index**.
3. Skim [CONTACT_CONTRACT.md](./CONTACT_CONTRACT.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [ENVIRONMENT.md](./ENVIRONMENT.md), [LOGGING.md](./LOGGING.md).
4. Implement **Phase 01 → Phase 07 in order.** Each phase ends with a **Handoff**.

**First useful:** after Phase 04 a non-technical person can send a WhatsApp broadcast to a filtered list. SMS and email are the same campaign machine with different pipes.

---

## All documents in this folder

| Doc | Description |
| --- | ----------- |
| [PLANNING.md](./PLANNING.md) | How we write phased plans. |
| [00_OVERVIEW.md](./00_OVERVIEW.md) | Master plan, vision, full **phase index**. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Next.js + Firebase + three send pipes. |
| [CONTACT_CONTRACT.md](./CONTACT_CONTRACT.md) | Contact, campaign, and message shapes. |
| [contracts/contact.example.json](./contracts/contact.example.json) | One outreach contact. |
| [contracts/campaign.example.json](./contracts/campaign.example.json) | One campaign + a message row. |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Firebase, Twilio, SMS, Gmail secrets vs hardcoded. |
| [LOGGING.md](./LOGGING.md) | Send and import logs the operator can trust. |
| [01_FOUNDATION.md](./01_FOUNDATION.md) | App shell, Firebase, auth, data model for all channels. |
| [02_CONTACTS.md](./02_CONTACTS.md) | Import discovery data, lists, filters. |
| [03_CAMPAIGNS.md](./03_CAMPAIGNS.md) | Channel-agnostic campaigns, templates, queue. |
| [04_WHATSAPP.md](./04_WHATSAPP.md) | Twilio WhatsApp broadcast (first live channel). |
| [05_BULK_SMS.md](./05_BULK_SMS.md) | Cheap Nigeria SMS provider (not Twilio SMS). |
| [06_EMAIL.md](./06_EMAIL.md) | Gmail API, throttled, one custom message per school. |
| [07_OPERATOR_POLISH.md](./07_OPERATOR_POLISH.md) | Non-technical UX, reports, safety. |
