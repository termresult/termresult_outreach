# How we write plans (TermResult Outreach)

**Created:** August 20, 2026  
**Status:** Active — canonical method for this product’s phased roadmap.  
**Applies to:** `termresult_outreach/docs/` and any large feature planned inside this repo.

**For agents:** Read this file **first** when asked to plan or implement from docs. You do **not** need to search the codebase to learn how plans are structured. Only open code when a phase doc tells you to implement something specific.

This file mirrors the workspace rule `.cursor/rules/plans_rules.mdc`. If the two ever drift, the workspace rule wins.

---

## 1. What a good plan is

A plan is a **roadmap**, not code. It tells any developer or agent **what** to build, **why**, **in what order**, and **how to know when a step is done** — without prescribing exact implementations.

---

## 2. Folder layout

```
termresult_outreach/
└── docs/
    ├── PLANNING.md
    ├── README.md
    ├── 00_OVERVIEW.md
    ├── ARCHITECTURE.md
    ├── ENVIRONMENT.md
    ├── LOGGING.md
    ├── CONTACT_CONTRACT.md
    ├── contracts/
    ├── 01_FOUNDATION.md
    └── … numbered phases
```

Phases use two-digit prefixes. Execute **in order**. The overview phase table is the source of truth.

---

## 3. Writing rules

- No code samples in plan docs (no functions, classes, or syntax blocks).
- Plain English: behaviour, flows, responsibilities.
- File paths and function/class **names** only.
- What, not how.
- Breaking schema changes are fine in beta — prefer a clean model over compatibility layers.

---

## 4. Agent workflow

1. Read [README.md](./README.md) and [00_OVERVIEW.md](./00_OVERVIEW.md).
2. Read this file if you have not already.
3. Read [ARCHITECTURE.md](./ARCHITECTURE.md) and the **Depends on** docs for the **current phase only**.
4. Implement only that phase. Satisfy **Exit criteria** before moving on.
5. Do not build Phase 06 email while still in Phase 04 WhatsApp unless a doc marks it optional.
6. Log per [LOGGING.md](./LOGGING.md) when touching send pipelines.
