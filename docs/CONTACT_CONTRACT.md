# Contact contract — who we message, and what we sent

**Created:** August 20, 2026  
**Status:** Active — Firestore documents and imports must match these keys  
**Related:** [contracts/contact.example.json](./contracts/contact.example.json) · [contracts/campaign.example.json](./contracts/campaign.example.json)

Discovery’s nested `SchoolRecord` is **too fat** for a send tool. We flatten into an **OutreachContact**. Keep a pointer back so we can re-import.

`schema_version` is `1.0.0`. Unknown fields are kept. Renames bump the version.

---

## 1. OutreachContact

| Key | Meaning |
| --- | ------- |
| `id` | Firestore id (stable). Prefer `source_place_id` as the document id when importing. |
| `source_place_id` | Maps `ChIJ…` or `emis:…` from discovery |
| `name` | School name |
| `area` | Area council / district if we have it |
| `address` | Formatted address if we have it |
| `phone_e164` | Best mobile in `+234…` form, or null |
| `phone_raw` | What we imported, for debugging |
| `email` | Best single email, lowercased, or null |
| `emails` | All emails we know |
| `website` | If any |
| `owner_name` | If enrichment found one |
| `channels` | Booleans: `whatsapp`, `sms`, `email` — computed from phone/email quality |
| `source` | `maps` or `directory` |
| `imported_at` | ISO time |
| `updated_at` | ISO time |

**Phone rule:** prefer `contact.from_maps.international_phone`, else national, else first extra phone. Normalise to E.164. If we cannot get `+234` plus 10 digits, `phone_e164` is null and WhatsApp/SMS are off.

**Email rule:** first `contact.from_website.emails[]` that is not a placeholder (`john@doe.com`, `your.address@email.com`, empty). Those placeholders from scrape noise are dropped.

---

## 2. Campaign

| Key | Meaning |
| --- | ------- |
| `id` | Firestore id |
| `name` | Operator label (“FCT event WhatsApp”) |
| `channel` | `whatsapp` \| `sms` \| `email` |
| `status` | `draft` \| `confirmed` \| `running` \| `paused` \| `done` \| `cancelled` |
| `audience` | Either a saved list id, or a filter snapshot (has_phone, areas, source) |
| `audience_count` | Frozen when they confirm |
| `template` | Provider template id (WhatsApp) or body with `{{merge}}` (SMS/email) |
| `email_subject` | Email only |
| `throttle` | `gap_seconds`, `daily_cap` (email uses these; others may ignore) |
| `created_by` | Operator email |
| `created_at` | ISO |

Merge fields v1: `school_name`, `area`, `owner_name`, `website`. Missing owner becomes a polite omission, not the word `null`.

---

## 3. Message

| Key | Meaning |
| --- | ------- |
| `id` | Firestore id |
| `campaign_id` | Parent |
| `contact_id` | Parent |
| `channel` | Same as campaign |
| `to` | E.164 or email actually used |
| `body_rendered` | What we sent (or template + variables) |
| `status` | `queued` \| `sending` \| `sent` \| `failed` \| `skipped` |
| `skip_reason` | If skipped |
| `error` | Short provider error if failed |
| `provider_id` | Twilio SID / Termii message id / Gmail message id |
| `idempotency_key` | `campaign_id + contact_id + channel` |
| `attempted_at` | ISO |
| `completed_at` | ISO |

One contact gets **at most one message row per campaign** unless the operator creates a new campaign or hits “retry failed”.

---

## 4. Suppression

| Key | Meaning |
| --- | ------- |
| `address` | E.164 or email |
| `channel` | Or `all` |
| `reason` | `stop` \| `bounce` \| `manual` |
| `created_at` | ISO |

---

## 5. Import mapping (from discovery)

| Discovery path | Outreach field |
| -------------- | -------------- |
| `place_id` | `source_place_id`, document id |
| `identity.name` | `name` |
| `location.area_query` or address locality | `area` |
| `location.formatted_address` | `address` |
| `contact.from_maps.international_phone` | `phone_raw` → `phone_e164` |
| `contact.from_website.emails[].value` | `emails`, `email` |
| `contact.from_maps.website` | `website` |
| `owner.name` | `owner_name` |
| `place_id` starts with `ChIJ` | `source = maps` |
| `place_id` starts with `emis:` | `source = directory` |

CSV from `contacts-live.csv` (name, phone, website, emails, whatsapp, owner, place_id) is the easy import. JSON `records.json` is the full import. Support both in Phase 02.
