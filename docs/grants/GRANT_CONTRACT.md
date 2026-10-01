# Grant contract — TermResult the applicant, and what we sent

**Created:** September 5, 2026  
**Status:** Active — Firestore documents must match these keys  
**Related:** [contracts/company-profile.example.json](./contracts/company-profile.example.json) · [contracts/grant.example.json](./contracts/grant.example.json) · [contracts/application.example.json](./contracts/application.example.json)

School `OutreachContact` is the wrong shape. Grants flatten into **CompanyProfile**, **GrantSource**, **Grant**, and **Application**.

`schema_version` is `1.0.0`. Unknown fields are kept. Renames bump the version.

---

## 1. CompanyProfile

One document. Id is `termresult` (singleton).

| Key | Meaning |
| --- | ------- |
| `id` | Always `termresult` |
| `legal_name` | Registered name |
| `trading_name` | TermResult |
| `country` | `NG` |
| `city` | Operating city |
| `entity_type` | e.g. `private_limited` |
| `cac_rc` | CAC number, or null |
| `tax_id` | TIN, or null |
| `founded_year` | Number, or null |
| `website` | Public site |
| `email` | Applications from this address when not overridden |
| `phone` | E.164 if we have it |
| `one_liner` | One sentence |
| `problem` | What schools lack |
| `solution` | What TermResult does |
| `traction` | Object: `schools`, `students`, `states`, `notes` — numbers only if real |
| `stage` | e.g. `pre_seed` |
| `sector_tags` | e.g. `edtech`, `school_os`, `results` |
| `team` | Array of `{ name, role, bio, linkedin }` |
| `documents` | Array of `{ id, kind, filename, storage_path, uploaded_at }` |
| `updated_at` | ISO |
| `updated_by` | Operator email |

Document `kind` values v1: `cac`, `deck`, `one_pager`, `financials`, `other`.

**Fact rule:** drafts may paraphrase `problem` / `solution` / `one_liner`. They may not invent `cac_rc`, counts, or team members.

---

## 2. GrantSource

| Key | Meaning |
| --- | ------- |
| `id` | Stable slug (`tony-elumelu`, `nitda`, `manual`) |
| `name` | Operator label |
| `homepage` | Where we look |
| `region_bias` | `nigeria` \| `africa` \| `global` |
| `intake` | `seed_search` \| `fetch` \| `manual` |
| `query` | Search string if `seed_search` |
| `enabled` | Boolean |
| `last_ran_at` | ISO or null |

---

## 3. Grant

| Key | Meaning |
| --- | ------- |
| `id` | Firestore id |
| `source_id` | Parent source, or `manual` |
| `title` | Listing title |
| `funder` | Organisation |
| `url` | Page we fetched |
| `canonical_url` | Dedup key (scheme/host/path, no tracking query) |
| `region` | `nigeria` \| `africa` \| `global` |
| `countries_eligible` | ISO codes or `worldwide` |
| `apply_via` | `email` \| `portal` \| `either` \| `unknown` |
| `apply_email` | If email or either, or null |
| `deadline_at` | ISO date or null |
| `amount_min` | Number or null |
| `amount_max` | Number or null |
| `currency` | e.g. `USD`, `NGN`, or null |
| `eligibility_notes` | Short extracted text |
| `required_fields` | Array of `{ key, prompt, kind }` — `kind` is `short` \| `long` \| `file` |
| `listing_status` | `open` \| `closed` \| `needs_human` \| `unknown` |
| `raw_excerpt` | Short extract for debug, not the full HTML |
| `discovered_at` | ISO |
| `updated_at` | ISO |

**Deadline rule:** if the page has no date, `deadline_at` is null and match treats it as open but ranks it below dated ones.

**Apply-via rule:** if we find a public applications@ email, `apply_via` is `email` or `either`. Forms-only pages are `portal`. Guessing is `unknown` until the operator sets it.

---

## 4. Application

| Key | Meaning |
| --- | ------- |
| `id` | Firestore id (prefer `grant_id` so one live row per grant) |
| `grant_id` | Parent |
| `status` | See below |
| `fit_score` | 0–100 or null before match |
| `fit_reasons` | Short bullets |
| `disqualifiers` | Hard-filter reasons; empty if eligible |
| `override_eligible` | Operator forced it back in |
| `pack` | `{ subject, cover_email, answers, attachment_kinds, needs_operator }` |
| `apply_choice` | `email` \| `portal` \| null |
| `to_email` | Address actually used |
| `message_id` | Outreach message row if emailed |
| `confirmation_url` | Portal receipt if any |
| `submitted_at` | ISO |
| `created_by` | Operator email |
| `updated_at` | ISO |

**Status:** `identified` \| `drafting` \| `ready_for_review` \| `approved` \| `queued_email` \| `submitted_email` \| `ready_for_portal` \| `submitted_portal` \| `won` \| `lost` \| `skipped`

`pack.answers` is a map of `required_fields.key` → `{ text, needs_operator }`.  
`pack.attachment_kinds` lists profile document kinds to attach.  
`pack.needs_operator` is true if any answer or a required profile field is blank.

One grant gets **at most one live application** unless the operator hits “start new cycle” after a closed listing is replaced.

---

## 5. What this contract is not

- Not an `OutreachContact`
- Not a school campaign
- Not a Cloud Grant demo-site PRD
