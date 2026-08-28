# TermResult Outreach — master plan

**Created:** August 20, 2026  
**Status:** Plan ready; execute phases **in order**.  
**Owners:** TermResult product team

**Product name:** TermResult Outreach · **Repo dir:** `termresult_outreach`  
**Firebase:** new project under `officialtermresult@gmail.com` (not the Maps/GCP `termresult` project)

**Method:** [PLANNING.md](./PLANNING.md) · **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) · **Contacts:** [CONTACT_CONTRACT.md](./CONTACT_CONTRACT.md) · **Env:** [ENVIRONMENT.md](./ENVIRONMENT.md) · **Logging:** [LOGGING.md](./LOGGING.md)

---

## 1. What we are building

A **simple web app** a non-technical teammate can open in the browser. They see the schools we already found, pick who to reach, write (or merge) a message, and send.

Three pipes, **one audience**, built in this order:

1. **WhatsApp** via [Twilio WhatsApp API](https://www.twilio.com/) — first live channel. Upcoming event broadcast (copy comes later).
2. **Bulk SMS** via a **Nigeria-priced** API (Twilio SMS is too expensive for this list). Recommended default: **Termii**. Fallback to evaluate: Sendchamp.
3. **Email last** via **Google Workspace Gmail API**. Few enough addresses that we send slowly: about **400 per day**, about **one every 3 minutes**, **each email customised to that school**.

```
Discovery export (CSV / JSON)     already on disk
            │
            ▼
     Import into Firebase
            │
            ▼
   Contacts + lists + filters
            │
            ▼
   Campaign (template + audience + channel)
            │
     ┌──────┼──────────────┐
     ▼      ▼              ▼
 WhatsApp  Bulk SMS     Gmail
 (Twilio)  (Termii)   (Workspace)
     │      │              │
     └──────┴──────────────┘
            │
            ▼
   Per-message log (sent / failed / skipped)
```

The operator never sees API keys. They see school name, phone, email, “can WhatsApp / can SMS / can email”, last send, and a big **Send** that asks for confirmation.

---

## 2. Why / key insight

Scraping is finished. The job now is **reach**, not **find**.

**Decisions that shape everything:**

- **Top-down, not three apps.** Phase 01 models contacts, campaigns, and a send queue that already know about WhatsApp, SMS, and email. Phase 04–06 only plug pipes. We do not rebuild lists for each channel.
- **WhatsApp first.** In Nigeria it is the channel people actually open. Twilio is acceptable here because WhatsApp Business is a different product than Twilio SMS pricing. Event broadcast is the first campaign.
- **SMS is local.** Twilio SMS to `+234` would burn the budget. Phase 05 picks a Nigerian API-first provider (Termii) with sender ID + delivery receipts. Same campaign UI as WhatsApp.
- **Email is last and slow on purpose.** We do not have tens of thousands of good emails. Gmail API from the Workspace account, personalised merge fields, hard throttle so Google does not lock the account. Two days of 400/day covers the current email list.
- **Firebase is the system of record for outreach**, not `records.json`. Discovery stays a one-way import. Re-import updates contacts; it must not wipe send history.
- **Non-technical UI on Vercel.** If it needs a terminal, it is not done.

---

## 3. Scope for v1

**In:**

- Next.js App Router, TypeScript, Vercel
- New Firebase project (Auth + Firestore). Google sign-in, allow-listed TermResult emails only
- Import from School Discovery `contacts-live.csv` and/or `records.json`
- One contact per school (or per reachable address), normalised `+234` phones, primary email
- Campaigns with merge fields (`{{school_name}}`, `{{area}}`, `{{owner_name}}`, …)
- WhatsApp via Twilio (approved template + session rules as Meta requires)
- Bulk SMS via Termii (or the evaluated alternative)
- Gmail API send with configurable delay (default 3 minutes) and daily cap (default 400)
- Per-message status, skip if no usable address for that channel, skip suppressions
- Operator screens: Contacts, Lists, Campaigns, Send log
- Proprietors is a live conversation list (who already talked to a school), not a send channel

**Foundation for later (designed in, not fully built):**

- Event landing page / RSVP
- Two-way WhatsApp inbox
- Auto-drip sequences
- Feeding “replied yes” into School Finder or Laravel

---

## 4. Product principles

- **Do not scrape from this app.** No Maps keys, no website crawlers.
- **Do not re-bill Google Maps.** Import only.
- **One send log per attempt.** Never silently retry in a loop.
- **Never send to a contact who opted out or already got that campaign** unless the operator explicitly says “send again”.
- **Channel truth:** a school with no phone cannot get SMS/WhatsApp; a school with no email cannot get Gmail. The UI says so in plain language.
- **Secrets stay on the server.** Browser talks to our routes; our routes talk to Twilio / Termii / Gmail.
- **Confirm before broadcast.** “You are about to message 1,204 schools on WhatsApp.”
- **Personalise email; templates for WhatsApp/SMS.** Meta will not let free-form WhatsApp broadcasts. SMS can be a template with merge fields. Email is the place we write a real letter per school.
- **Light UI, no jargon.** Buttons say “Send WhatsApp”, not “enqueue provider payload”.

---

## 5. Tech stack

| Piece | Choice | Why | Rejected |
| ----- | ------ | --- | -------- |
| App | Next.js on Vercel | Same family as School Finder; non-technical URL | CLI, Flutter (overkill for an internal tool) |
| Data / auth | Firebase Auth + Firestore | Fast, fits TermResult gmail, no new server to babysit | Putting contacts in the Laravel backend (wrong product) |
| WhatsApp | Twilio WhatsApp API | User asked; templates + status callbacks | Meta Cloud API directly (can revisit if Twilio WhatsApp cost hurts) |
| SMS | Termii (default) | Nigeria rates, REST API, DND/sender ID, webhooks | Twilio SMS (expensive), random web portals with no API |
| Email | Gmail API on Workspace | User asked; we customise each letter; volume is small | SendGrid / SES (later if we outgrow 400/day) |
| Hosting | Vercel | Preview URLs, env, cron for the email drip | A always-on VM |

---

## 6. How to use this plan

1. Create the Firebase project and Vercel project (human, Phase 01).
2. Implement 01 → 07 in order.
3. **Demoable after Phase 04** (WhatsApp to a 3-school test list).
4. Event copy can land in Phase 04 without changing the data model.

---

## 7. Phase index

| Phase | Document | In one sentence |
| ----- | -------- | --------------- |
| 01 | [01_FOUNDATION.md](./01_FOUNDATION.md) | Next.js shell, Firebase, auth, data model that already knows all three channels. |
| 02 | [02_CONTACTS.md](./02_CONTACTS.md) | Import the scrape, normalise phones/emails, browse and filter. |
| 03 | [03_CAMPAIGNS.md](./03_CAMPAIGNS.md) | Campaigns, merge templates, queue — no provider yet. |
| 04 | [04_WHATSAPP.md](./04_WHATSAPP.md) | Plug Twilio WhatsApp; first real broadcast. |
| 05 | [05_BULK_SMS.md](./05_BULK_SMS.md) | Plug Termii (or chosen SMS API). |
| 06 | [06_EMAIL.md](./06_EMAIL.md) | Gmail API, throttle, one custom letter per school. |
| 07 | [07_OPERATOR_POLISH.md](./07_OPERATOR_POLISH.md) | Reports, safety copy, make it usable by a non-engineer. |

---

## 8. Definition of done

A signed-in teammate can import the FCT list, build an audience, send a WhatsApp campaign, send a bulk SMS campaign, and start a throttled personalised Gmail campaign — each with a readable send log — without opening a terminal or seeing a secret.

---

## 9. Out of scope for v1

- Re-running School Discovery or calling Google Maps
- Two-way support inbox / chatbot
- Parent-facing School Finder changes
- Multi-tenant SaaS (other companies using this app)
- Voice / USSD
- Buying a new dedicated SMS short code (sender ID registration is enough)
- Auto-generating email copy with an LLM (nice later; Phase 06 can leave a “body” field the operator pastes or we merge)
