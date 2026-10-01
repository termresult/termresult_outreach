# Environment — TermResult Grants

**Created:** September 5, 2026  
**Status:** Active  
**Related:** [ARCHITECTURE.md](./ARCHITECTURE.md) · parent [../ENVIRONMENT.md](../ENVIRONMENT.md)

Grants **inherits** Outreach env (Firebase, allow-list, Gmail, `CRON_SECRET`). This file only adds what Grants needs.

---

## 1. What is hardcoded vs secret

| Kind | Examples | Where |
| ---- | -------- | ----- |
| Hardcoded | Region buckets, document kinds, seed source slugs, default search queries, schema version | Source |
| Config (non-secret) | Default Grants email daily cap if we split it from school email, profile document size limit | Vercel env or Settings |
| Secret | LLM key, search API key, Firebase Storage admin as already used | Vercel env **only**. Never `NEXT_PUBLIC_` |

---

## 2. Accounts a human must create (or already have)

| Account | Who | Notes |
| ------- | --- | ------ |
| **Firebase + Gmail** | Already from Outreach | Same project. Enable Storage if it is not on. |
| **Gemini (default LLM)** | TermResult | Server key. Swap later only by env, not by rewriting phases. |
| **Search API** | TermResult | One web-search provider the server can call. Used for the weekly pass and Find grants. |

If the search key is missing, paste-URL and seed fetch still work; Find grants says search is off.

---

## 3. Env names (indicative)

Use these names so phases stay consistent:

- All names already in parent ENVIRONMENT (Firebase, Gmail, `ALLOWLIST_EMAILS`, `CRON_SECRET`)
- `GEMINI_API_KEY` — draft and extract
- `GRANT_SEARCH_API_KEY` — discovery search
- `GRANT_SEARCH_ENDPOINT` — if the provider is not hardcoded
- `GRANTS_EMAIL_DAILY_CAP` — optional; if unset, share `EMAIL_DAILY_CAP` with school mail
- `GRANT_DOC_MAX_BYTES` — default a few megabytes per upload

---

## 4. What this feature must never load

- `GOOGLE_MAPS_API_KEY`
- Twilio / Termii keys for grant sends
- School discovery `.env.local`
- Funder passwords

---

## 5. Test mode

Settings keep a **test grant email** (default: the signed-in operator). First email apply of a day can be forced to that address. Production send requires the same “this is the real send” confirmation taste as school campaigns.
