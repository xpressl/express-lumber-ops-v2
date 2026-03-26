# Critical Steering Work

## Project Context

This is a greenfield Next.js 14+ build running on Windows 11. No Docker sandbox.

Read these files before starting any work:
- `PLAN.md` — full build plan with 13 phases
- `CLAUDE-RULES.md` — build rules (MUST follow)
- `express_lumber_ops_greenfield_prd_v2.md` — PRD (source of truth for WHAT to build)

## Current Priority

**Phase 0: Foundation Documentation** — Create all 12 required docs in `docs/` folder BEFORE any code.

Then **Phase 1: Platform Backbone** — scaffolding, database, services, middleware, shared UI.

Follow the phase order in PLAN.md strictly. Do NOT skip phases.

## Rules

- CLAUDE-RULES.md says: no implementation before architecture, schema, permissions, and API planning are written down
- Business logic must stay out of UI components
- Every important write action must create an audit event
- AI features must always run behind review queues and human approval
- Source code lives in `src/`
- Dev server: `npm run dev` at localhost:3000

---

After you finish steering work, proceed to tasks in tasks.json.
