# CLAUDE-RULES.md

## Purpose

This file defines how Claude Code must work while building the product described in the PRD.

The PRD is the source of truth for what to build.

This file is the source of truth for how to plan, sequence, document, and implement the build.

Claude Code must follow both files together.

---

## Core Operating Rules

1. Treat this as a greenfield build from scratch.
2. Do not clone, inherit, or mirror any prior repo architecture unless explicitly instructed.
3. Do not start implementation before architecture, schema, permissions, and API planning are written down.
4. Build one module at a time in the phase order defined by the PRD.
5. No fake UI. If a screen exists, it must be connected to real data, real business rules, or clearly marked as mock during planning only.
6. Keep business logic out of UI components.
7. Every important write action must create an audit event.
8. Every operational module must expose blockers, exceptions, and overdue work.
9. AI features must always run behind review queues, confidence thresholds, and human approval where applicable.
10. Never silently invent major scope outside the PRD. If proposing additions, write them into DECISIONS.md first and mark them as proposed.

---

## Required Files To Create Before Feature Coding

Claude Code must create and maintain these files before building feature code:

1. `PLAN.md`
2. `PROGRESS.md`
3. `DECISIONS.md`
4. `DATA-MODEL.md`
5. `API-SPECS.md`
6. `RISKS.md`
7. `PERMISSIONS-MATRIX.md`
8. `APPROVAL-POLICIES.md`
9. `EVENT-BACKBONE.md`
10. `EXCEPTION-MODEL.md`
11. `ROLLOUT-PLAN.md`
12. `TEST-STRATEGY.md`

These files must be updated continuously as the build advances.

---

## What Each Required File Must Contain

### `PLAN.md`
- overall build phases
- current phase
- phase goals
- module order
- dependencies between modules
- immediate next tasks

### `PROGRESS.md`
- completed tasks
- current tasks
- blockers
- decisions already locked
- known gaps
- date stamped updates

### `DECISIONS.md`
- architecture decisions
- schema decisions
- auth and permission decisions
- infra decisions
- tradeoffs
- rejected alternatives and why

### `DATA-MODEL.md`
- all main entities
- key fields
- relationships
- lifecycle notes
- indexing notes
- soft delete and audit rules
- branch and scope logic

### `API-SPECS.md`
- route groups
- route purpose
- request shape
- response shape
- validation rules
- auth rules
- scope rules
- side effects
- audit events triggered
- idempotency requirements where relevant

### `RISKS.md`
- technical risks
- operational risks
- rollout risks
- migration risks
- user adoption risks
- data quality risks
- mitigation plan for each

### `PERMISSIONS-MATRIX.md`
- all permissions by action
- roles mapped to permissions
- scope restrictions
- branch restrictions
- field-level visibility rules
- approval-required actions

### `APPROVAL-POLICIES.md`
- approval types
- requester roles
- approver roles
- threshold rules
- timeouts
- escalation rules
- audit requirements

### `EVENT-BACKBONE.md`
- every event type in the system
- event producers
- event consumers
- event retention rules
- timeline behavior by entity
- audit and notification rules

### `EXCEPTION-MODEL.md`
- exception categories
- severity levels
- queue ownership
- SLA rules
- resolution states
- escalation paths

### `ROLLOUT-PLAN.md`
- module rollout order
- pilot users
- pilot branches
- training notes
- cutover risks
- fallback plan
- branch enablement rules

### `TEST-STRATEGY.md`
- unit test plan
- integration test plan
- workflow test plan
- role/permission test plan
- audit test plan
- import validation test plan
- mobile workflow test plan

---

## Build Sequence

Claude Code must follow this sequence unless the PRD explicitly overrides it.

### Phase 0: Foundation Planning
Deliverables:
- PLAN.md
- PROGRESS.md
- DECISIONS.md
- RISKS.md
- rollout assumptions
- architecture summary

### Phase 1: Platform Backbone
Deliverables:
- tenancy and branch model
- user model
- role model
- permissions model
- feature flag model
- approval model
- audit model
- event model
- exception model

No operational module may be built before this backbone exists.

### Phase 2: Core Data and API Contract
Deliverables:
- DATA-MODEL.md
- API-SPECS.md
- initial schema
- service boundaries
- naming standards
- status/state model

### Phase 3: Access Control and Workspace Configuration
Deliverables:
- login/auth flows
- role management
- permission assignment
- scoped access
- feature toggles
- branch settings
- user preferences
- approval policies

### Phase 4: Order Backbone
Deliverables:
- customer
- products
- orders
- order items
- status machine
- audit events
- exception generation

### Phase 5: Dispatch and Pickup
Deliverables:
- dispatch board
- truck planner
- pickup queue
- route assignment
- dispatch exceptions
- dispatch audit trail

### Phase 6: Yard and Receiving
Deliverables:
- yard tasks
- receiving workflow
- discrepancy queue
- photo review
- cycle counts
- damage log

### Phase 7: Delivery and Driver Workflows
Deliverables:
- driver route
- stop handling
- POD
- COD
- route history
- return custody flow

### Phase 8: Collections and Credit
Deliverables:
- AR aging
- account assignment
- tasks
- outreach
- promises
- disputes
- escalation
- credit hold controls

### Phase 9: CRM and Estimates
Deliverables:
- customer 360
- leads
- follow-ups
- estimates
- dormant accounts
- cross-sell
- salesperson workflows

### Phase 10: Pricing and Purchasing
Deliverables:
- vendor costs
- price imports
- margin controls
- RFQ
- PO flow
- receiving tie-in
- AP exception tie-in

### Phase 11: Bridge and Import Engine
Deliverables:
- file intake
- mapping
- validation
- reconciliation
- review queues
- import audit
- import exception handling

### Phase 12: Reporting, Search, and Global Exception Center
Deliverables:
- command search
- dashboards
- reports
- exception center
- management visibility

### Phase 13: Hardening
Deliverables:
- test coverage
- performance checks
- role tests
- mobile testing
- import reliability checks
- security checks

---

## Strict Implementation Rules

1. Use service layers for business logic.
2. Use schema validation for every API write.
3. Every state-changing action must:
   - validate input
   - validate permission
   - validate scope
   - write audit event
   - generate exception if needed
4. Every module must define:
   - happy path
   - edge cases
   - failure cases
   - exception cases
   - approval cases
5. Never hide business rules inside front-end forms.
6. Never duplicate permission logic in multiple places without a shared policy layer.
7. Never allow destructive actions without confirmation and audit.
8. Never mix branch-global settings with user-local preferences.
9. Never treat role names as permissions.
10. Never expose sensitive financial fields to users without field-level visibility rules.

---

## Role and Permission Rules

Claude Code must treat access control as a first-class platform layer.

### Required support
- one user can have multiple roles
- roles can be scoped by branch or company
- permissions are action-based
- permissions can be view, create, edit, approve, override, export, or admin
- field-level visibility must be supported
- temporary elevated access must be design-ready even if not in MVP
- feature access must be controlled separately from permissions

### Required outputs
- role catalog
- permission catalog
- scope catalog
- approval matrix
- feature flag matrix

---

## Feature Toggle Rules

The system must support feature flags at:
- company level
- branch level
- role level
- user level
- environment level

Flags must support:
- on
- off
- beta
- read-only
- hidden
- staged rollout

Every feature flag change must be audited.

---

## Approval Rules

Approval is separate from ordinary permission.

Every approval flow must support:
- request creation
- approver assignment
- threshold logic
- approve
- deny
- expire
- escalate
- audit trail
- reason capture
- before/after values

At minimum, approval policies must exist for:
- price overrides
- credit releases
- inventory adjustments
- write-offs
- PO approval thresholds
- dispatch overrides
- route departure exceptions
- AP matching exceptions
- vendor claim settlements
- returns above threshold

---

## Audit and Event Rules

Every important action must produce one or more events.

At minimum, events must exist for:
- login
- logout
- failed login
- role change
- permission change
- feature flag change
- order created
- order edited
- order status changed
- dispatch assigned
- truck changed
- stop delivered
- POD captured
- COD collected
- inventory adjusted
- discrepancy opened
- discrepancy resolved
- import created
- import approved
- import rejected
- approval requested
- approval granted
- approval denied
- report exported
- sensitive record viewed

---

## Exception Rules

Every module must define exceptions.

Exceptions must include:
- category
- severity
- owner
- branch
- related entity
- created at
- SLA target
- current state
- resolution note
- escalation status

Examples:
- missing item
- backorder unresolved
- credit hold blocking dispatch
- route overload
- failed COD collection
- receiving quantity mismatch
- damaged goods
- import rejection
- unapproved price override
- overdue collection task

---

## UX and UI Rules

1. Build mobile first for:
   - drivers
   - yard
   - pickup
   - receiving
2. Build desktop first for:
   - dispatch
   - collections
   - pricing
   - purchasing
   - management dashboards
3. Every table must support:
   - saved filters
   - column preferences
   - sort
   - search
   - branch scope
4. Every dashboard must support role-based defaults.
5. Every user must be able to configure personal workspace preferences inside allowed limits.

---

## AI Feature Rules

AI must never auto-commit high-risk operational changes without review.

AI may assist with:
- extraction
- matching
- classification
- suggestion
- anomaly detection
- summarization

AI outputs must include:
- confidence score
- source reference when possible
- review status
- approval path when confidence is below threshold

No AI feature may bypass audit logging.

---

## Delivery Standard For Claude Code

Before moving from planning into coding, Claude Code must provide:
1. architecture summary
2. final initial schema proposal
3. API route group proposal
4. role and permission strategy
5. approval strategy
6. event backbone summary
7. exception model summary
8. phased build order
9. top risks and mitigations

Only after that may feature implementation begin.

---

## Definition of Done

A module is not done when the UI exists.

A module is only done when:
- data model exists
- API exists
- validation exists
- auth exists
- scope rules exist
- audit events exist
- exceptions exist
- approvals exist where needed
- tests exist
- sample data exists
- documentation is updated

---

## Final Instruction

Claude Code must optimize for operational correctness, auditability, controlled rollout, and long-term maintainability.

Do not optimize for speed by skipping planning.
Do not optimize for visual polish at the expense of workflow correctness.
Do not optimize for broad scope before the backbone is stable.
