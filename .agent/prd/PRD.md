# Express Lumber Ops Greenfield PRD

## 1. Product Name
Express Lumber Ops

## 2. Product Summary
Express Lumber Ops is a web based operations system for a wholesale building materials distributor. It replaces paper, spreadsheet, text message, and disconnected ERP workflows with a single operating layer for order execution, dispatch, delivery, yard work, receiving, purchasing, collections, sales follow up, pricing control, and management visibility.

This is not an ERP replacement. It is an operational control system that sits above a legacy ERP and uses controlled imports and exports to sync critical data until a deeper bridge exists.

## 3. Why This Must Be Built
The current business model has these structural problems:
- orders, deliveries, pickups, backorders, and collections are managed across paper, calls, texts, PDFs, and spreadsheets
- dispatchers do not have a single live board for route planning and load status
- drivers rely on paper and weak stop level proof
- yard teams lack a digital execution queue
- purchasing and pricing are too reactive and depend on manual checking
- collections has weak ownership, weak follow up, and poor documentation
- management has poor visibility into what is late, blocked, risky, profitable, or broken
- the ERP is legacy and has no clean API, so operational work must be built around controlled imports and reconciliation

## 4. Product Vision
Create the operating system for a building supply yard.

The platform must let the business answer these questions instantly:
- What orders are due today, and what state is each one in?
- What is ready, not ready, partially ready, backordered, on hold, loaded, out, delivered, refused, or rescheduled?
- Which truck should carry which orders, in what sequence, and at what expected capacity and margin?
- What does each driver still need to do right now?
- Which pickups are waiting and what is blocking them?
- What vendor costs changed and which quotes or selling prices are now at risk?
- Which receivings are short, damaged, mismatched, or unverified?
- Which customers owe money, promised money, disputed money, or should be on hold?
- Which sales opportunities are dormant or need follow up?
- Which exceptions need attention first?

## 5. Product Principles
1. Operations first. Every screen must help staff do real work faster.
2. Exception driven. The system must surface what is wrong, late, blocked, risky, or expensive.
3. State controlled. Orders, stops, pickups, returns, receivings, and collections all need strict status transitions.
4. Audit everything. Every important action must create a timestamped event.
5. Mobile where work happens. Driver, yard, receiving, and pickup workflows must work well on phones.
6. Import tolerant. The product must function in a legacy ERP environment.
7. Fast lookup. Search must be global and instant.
8. No fake dashboards. Every metric must trace back to operational data.
9. Permission by action, not by job title alone.
10. Configurable by branch, role, and user without code changes.

## 6. Personas, Roles, and Work Context

### 6.1 Executive / Owner
Needs company wide visibility, margin visibility, branch comparisons, approval authority, and policy control.

### 6.2 General Manager
Needs multi department visibility, SLA monitoring, exception handling, staffing insight, and approval workflows.

### 6.3 Branch Manager
Needs full control over one branch, local staffing visibility, local dispatch, local inventory operations, local approval rights, and branch level settings.

### 6.4 Dispatcher
Needs an order board, truck planner, route view, driver visibility, pickup queue, backorder awareness, and issue handling.

### 6.5 Yard Manager
Needs workforce balancing, prep queue control, bay control, load visibility, receiving visibility, cycle count accountability, and damage oversight.

### 6.6 Yard Worker / Loader
Needs task queue, order prep instructions, loading sequence, exception note entry, and limited inventory confirmation actions.

### 6.7 Driver
Needs today's route, current stop instructions, POD, COD, stop exceptions, returns capture, and navigation.

### 6.8 Counter Sales
Needs order lookup, pickup coordination, customer communication, estimate support, and visibility into readiness without broad finance access.

### 6.9 Outside Sales
Needs customer 360, estimates, follow ups, dormant account recovery, cross sell visibility, and limited operational insight into their customers.

### 6.10 Collections / AR Rep
Needs aging, assignment, notes, promises, payment plans, dispute tracking, escalation, and hold recommendations.

### 6.11 AR Manager / Credit Manager
Needs collector oversight, writeoff approvals, hold release approvals, payment plan approvals, and company risk visibility.

### 6.12 Purchasing
Needs vendor price imports, RFQs, quote comparison, PO creation, expected receipts, and three way match controls.

### 6.13 Receiving Clerk
Needs inbound visibility, discrepancy handling, image evidence capture, and controlled stock receiving actions.

### 6.14 AP Support / Finance
Needs payable matching, invoice review, receiving exceptions, and financial approval workflows.

### 6.15 Customer Service / Inside Ops
Needs issue lookup, customer communication, tracking, reschedule support, and limited edit power.

### 6.16 Systems Admin
Needs user administration, role administration, feature management, policy configuration, and audit visibility.

## 7. Core Problem Statement by Department

### Dispatch
No single source of truth for what should go out, when, on which truck, and with what readiness.

### Delivery
Weak proof, weak COD control, weak communication, weak route history.

### Yard
No reliable prep queue, no clear loading priority, no live workload balance.

### Receiving
Shorts, damages, and mismatches get missed before inventory or AP is affected.

### Pricing
Cost changes are not reflected fast enough, quotes expire silently, margin leaks.

### Purchasing
Vendor decisions are fragmented, receipts and invoices are not tightly reconciled.

### Collections
Follow up is inconsistent, notes are scattered, promises are not enforced.

### Sales / CRM
Dormant and cross sell opportunities are missed, estimates are not followed aggressively.

### Management
No live operational nerve center.

### Access and Control
Most internal systems fail because access is either too broad or too rigid. Staff either see too much and make mistakes, or cannot do their work and fall back to paper, texting, and side channels.

## 8. Scope Summary
This PRD defines a greenfield build with 12 major modules:
1. Command Center
2. Access Control, Role Management, and Workspace Configuration
3. Orders and Order Lifecycle
4. Dispatch and Route Planning
5. Driver and Delivery Execution
6. Pickup Queue
7. Yard and Warehouse Execution
8. Receiving and Verification
9. Pricing and Margin Control
10. Purchasing and Vendor Control
11. Collections and Credit Control
12. CRM and Revenue Recovery

Cross cutting systems:
- identity and authentication
- permissions and scoped access
- approvals and policy engine
- feature flags and rollout controls
- import bridge and reconciliation
- event timeline and audit log
- exception engine
- notifications and communication
- universal search
- reporting and analytics
- file and image management

## 9. Module Requirements

## 9.1 Command Center

### Goal
Give leadership and supervisors one live screen showing what needs attention.

### Must Have
- today overview: order counts by status, truck counts, pickup queue count, delayed stop count, COD due, backorders, receivings pending review, credit holds, collections promises due today
- top exceptions panel
- department health blocks: dispatch, yard, delivery, collections, purchasing, pricing
- quick actions for common interventions
- live activity feed
- role based views

### Problems Solved
- no shared operating picture
- supervisors react too late
- critical issues are buried in separate modules

### Enhancements Beyond Existing Thinking
- weighted exception score
- shift handoff summary
- what changed since start of shift timeline
- operational SLA monitor

## 9.2 Access Control, Role Management, and Workspace Configuration

### Goal
Give every user exactly the access they need, no more and no less, while allowing company, branch, department, and user level customization without code changes.

### Why This Module Is Foundational
This is not a side feature. Every operational module depends on it. Without this layer, the product will become unsafe, rigid, and difficult to roll out.

### Core Concepts
- a user is a person
- a role is a reusable template of capabilities
- a permission is an action the system allows
- a scope determines where a permission applies
- an approval policy defines who must approve sensitive actions
- a feature flag controls whether a feature is active
- a workspace preference controls how a user sees and uses the system
- a branch setting controls how one location behaves

### Role Model Requirements
- support one user with multiple roles
- support role assignments by branch or location
- support temporary role assignment
- support backup coverage assignments
- support role activation windows if needed
- support default roles by department but allow exceptions

### Example Roles
- Owner
- Executive
- General Manager
- Branch Manager
- Dispatcher
- Yard Manager
- Yard Worker
- Driver
- Counter Sales
- Outside Sales
- Collections Rep
- AR Manager
- Credit Manager
- Purchasing
- Receiving Clerk
- AP Support
- Customer Service
- Finance
- Systems Admin

### Permission Model Requirements
Permissions must be action based, not page based only.

Examples:
- view_orders
- create_orders
- edit_orders
- cancel_orders
- override_order_status
- assign_truck
- reorder_route_stops
- mark_order_ready
- mark_order_loaded
- view_driver_location
- view_cod_amounts
- collect_cod
- edit_customer_credit_hold
- release_credit_hold
- view_cost
- edit_sell_price
- approve_price_override
- import_vendor_prices
- approve_import_batches
- edit_inventory_counts
- approve_cycle_count_adjustment
- create_purchase_order
- approve_purchase_order
- receive_purchase_order
- approve_ap_match
- view_ar_aging
- assign_collection_accounts
- edit_payment_plan
- approve_writeoff
- view_profitability
- export_reports
- manage_users
- manage_roles
- manage_feature_flags
- manage_settings

### Scope Model Requirements
Each permission can be limited by scope.

Supported scopes:
- all company data
- one or more assigned branches
- assigned customers only
- assigned trucks only
- own records only
- own team only
- read only
- edit but not approve
- approve up to dollar threshold
- approve only inside policy conditions
- temporary access until a defined date

### Approval Workflows
The system must support request, approve, reject, and override patterns for sensitive actions.

Examples:
- price override
- credit release
- writeoff approval
- inventory adjustment approval
- AP three way match exception approval
- truck overload override
- route departure with unresolved issues
- return approval
- vendor claim settlement
- import batch approval
- user role escalation

Each approval record must include:
- requester
- approver
- timestamp
- entity reference
- old value
- new value
- reason
- optional note
- optional attachment

### Feature Flag Requirements
Feature flags must be available at:
- company level
- branch level
- role level
- user level
- environment level

Example flags:
- collections module enabled
- public tracking enabled
- POD photo required
- POD signature required
- route optimization enabled
- AI extraction review enabled
- AI visual verification enabled
- customer SMS enabled
- voice notes enabled
- warehouse transfer enabled
- proof photo required for COD stops

### Workspace Customization Requirements
Each user must be able to personalize their workspace within allowed limits.

Required preferences:
- default landing page
- dashboard widget layout
- visible table columns
- saved filters
- default branch
- default printer
- notification preferences
- dark or light mode
- compact or comfortable density
- pinned quick actions
- favorite reports

### Operational Configuration Requirements
Admins and delegated managers must be able to configure:
- order statuses
- issue codes
- delivery failure reasons
- backorder reasons
- damage reasons
- yard task types
- route color rules
- payment promise outcomes
- call outcome codes
- credit hold rules
- required fields by workflow
- branch specific cutoff times
- truck capacity rules
- appointment windows
- POD requirements
- return reason codes
- pickup readiness rules

### Field Level Visibility Requirements
The system must support hiding or masking sensitive fields.

Examples:
- sales rep can see sell price but not landed cost
- dispatcher can see COD due but not full AR aging
- driver can see stop notes but not margin or internal dispute notes
- yard worker can see what to load but not customer balance or profitability

### Security and Audit Requirements
- login history
- failed login visibility
- permission change audit
- role change audit
- approval audit
- feature flag change audit
- export audit
- sensitive record access audit
- impersonation logging if impersonation exists
- optional two factor auth for sensitive roles
- session timeout by role
- trusted device handling for mobile workflows if needed

### Problems Solved
- too much access causes mistakes
- too little access forces side channels
- no clean rollout path for unfinished features
- no safe way to delegate approvals
- no personalization causes poor adoption

### Enhancements
- access simulation tool to preview what a user can see
- policy builder for advanced approval rules
- delegated admin by branch
- temporary elevated access with auto expiry

## 9.3 Orders and Order Lifecycle

### Goal
Provide a strict operational order model from intake through completion.

### Order Types
- delivery
- pickup
- will call
- transfer
- return pickup
- vendor drop ship reference record

### Required Order States
- Draft
- Imported
- Needs Review
- Approved
- On Credit Hold
- Waiting Inventory
- Partially Ready
- Ready
- Loading
- Loaded
- Dispatched
- Out for Delivery
- Delivered
- Pickup Ready
- Picked Up
- Refused
- Rescheduled
- Cancelled
- Closed

### Core Features
- create orders manually or from import
- attach customer, jobsite, contacts, tags, PO, sales rep, requested date, appointment flag, COD flag
- line items with quantity, unit, length, location, weight estimate, notes, substitutions allowed flag
- automatic readiness rollup from line item availability and yard progress
- split order support
- hold reasons
- reschedule reasons
- file attachments and images
- line level issue flags
- order summary card and printable pack slip or load summary

### Problems Solved
- no clean operational order state
- hard to know what is really ready
- impossible to distinguish blocked vs late vs partial

### Enhancements
- strict state machine rules
- line level substitutions approval flow
- margin at risk flag when cost changed after quote
- one unified event timeline per order

## 9.4 Dispatch and Route Planning

### Goal
Turn orders into executable runs with clarity and control.

### Core Features
- order board by date, status, route zone, priority, assigned truck, dispatcher, and readiness
- drag and drop truck planner
- route sequencing
- route map
- truck capacity estimator by weight, pieces, bundle count, length constraints, and stop mix
- dispatch checklist before release
- driver assignment
- route notes
- delayed order carryover queue
- route history and replay

### Problems Solved
- dispatching by memory and paper
- overloading or bad sequence planning
- no visibility into what got missed and why

### Enhancements
- route profitability score
- route feasibility score
- stop service time estimates
- customer window generation per stop, not same window for every stop
- truck reload or second run planning
- visual why this truck is overloaded explanation

## 9.5 Driver and Delivery Execution

### Goal
Give drivers a phone first workflow for route execution.

### Core Features
- today's route with stop order and map
- current stop mode with products, notes, contact info, gate codes, delivery instructions
- POD capture: signature, photo, notes, GPS stamp, timestamp
- COD capture with amount due, payment type, amount collected, shortage or refusal reason
- stop outcomes: delivered, partial, refused, no answer, site closed, rescheduled, damaged, left on site
- return to yard reason capture
- stop issue escalation
- route summary and end of day closeout

### Problems Solved
- paper stop sheets
- missing POD
- weak COD control
- no clean stop issue documentation

### Enhancements
- offline capable driver mode
- multi photo proof
- customer confirmation text after POD
- failed delivery workflow that automatically creates yard or dispatch follow up tasks

## 9.6 Pickup Queue

### Goal
Make pickup and will call execution visible and fast.

### Core Features
- pickup board by ready status and arrival status
- lane or bay assignment
- customer arrival check in
- internal prep timer
- handoff confirmation
- pickup proof photo or signature if needed
- issue reasons for delay
- call ahead queue

### Problems Solved
- customer waiting with no queue clarity
- yard confusion on what pickup is next
- poor handoff proof

### Enhancements
- SMS ready for pickup and we see you arrived workflows
- yard SLA timer for ready pickups
- customer self check in link

## 9.7 Yard and Warehouse Execution

### Goal
Digitize physical work inside the yard.

### Core Features
- my tasks
- workload board
- order prep queue
- loading queue
- bay status
- transfer tasks
- cycle counts
- damage log
- location level inventory check tasks
- length tally tool for random length materials
- completion and exception notes with photos

### Problems Solved
- no live tasking
- unclear prep status
- loading bottlenecks hidden until too late
- no clean damage or count accountability

### Enhancements
- skill based task assignment
- queue aging warnings
- forklift bottleneck indicators
- staging lane visual map

## 9.8 Receiving and Verification

### Goal
Create a controlled receiving process with image backed discrepancy review.

### Core Features
- expected receipts calendar
- PO receiving workflow
- line by line receive, short, over, damaged, substitute, reject
- photo capture during receiving
- AI assisted count, label, or product verification where useful
- discrepancy review queue
- receiver notes and evidence
- vendor issue creation
- receiving to AP hold workflow
- stock update only after approval rules are met

### Problems Solved
- missed shortages
- inventory pollution
- AP paying bad receipts
- weak evidence for vendor claims

### Enhancements
- discrepancy center with severity levels
- invoice blocked pending receipt resolution workflow
- support for bundle photo history
- receiving confidence score on imports and AI detection

## 9.9 Pricing and Margin Control

### Goal
Keep selling prices aligned with cost reality and open quote risk.

### Core Features
- product catalogue with cost, sell, margin, vendor, inventory context
- vendor price import workflow
- cost change log
- price history
- open quote exposure list
- expiration tracking
- competitor reference tracking
- quote simulator and bulk quote impact analysis
- alerts for negative margin or low margin risk

### Problems Solved
- slow reaction to vendor changes
- margin leaks
- stale quotes still being honored blindly

### Enhancements
- rule based suggested sell price changes
- quotes affected by today's vendor file panel
- random length aware quoting tools
- visual margin waterfall on each quote

## 9.10 Purchasing and Vendor Control

### Goal
Give purchasing a real control center instead of inbox and spreadsheet handling.

### Core Features
- vendor directory
- vendor item pricing
- RFQ creation and comparison
- purchase order creation and tracking
- expected receipts calendar
- receipt variance reporting
- three way match: PO vs receipt vs invoice
- payable review queue
- vendor scorecards for reliability, fill rate, and cost volatility

### Problems Solved
- fragmented vendor knowledge
- weak buying discipline
- invoice mismatches caught too late

### Enhancements
- recommended reorder list from demand and backorder pressure
- buy decision support by lead time, reliability, and margin impact
- vendor claim workflow with status and attachments

## 9.11 Collections and Credit Control

### Goal
Turn AR follow up into a documented workflow with ownership and escalation.

### Core Features
- aging dashboard
- account assignment rules
- customer account detail
- call logs and notes
- promises to pay
- payment plans
- disputes
- escalation queue
- account memos
- credit hold recommendation engine
- dispute aging and owner tracking

### Problems Solved
- missed follow ups
- poor note history
- no accountability for promises
- weak link between AR and order release

### Enhancements
- promise reliability score per customer
- automatic next action suggestions
- hold and release workflow tied to customer behavior and payment proof
- collector performance reporting by recovered cash and promise kept rate

## 9.12 CRM and Revenue Recovery

### Goal
Recover revenue from existing customers and stop estimates from dying silently.

### Core Features
- customer 360 profile
- contact history
- open estimates
- follow up queue
- dormant account list
- cross sell opportunities
- job and project notes
- lost estimate reasons
- sales activity log

### Problems Solved
- follow up is manual and inconsistent
- dormant customers disappear from view
- cross sell depends on memory

### Enhancements
- customer buys doors but not trim type rule based prompts
- estimate aging queue with next best action
- customer segment playbooks
- high value lost quote recovery workflows

## 10. Cross Cutting Systems

## 10.1 Import Bridge and Reconciliation

### Goal
Make legacy ERP data usable without trusting imports blindly.

### Core Features
- import types: orders, customers, invoices, AR aging, vendor price lists, product catalogue, inventory snapshots, open quotes
- file upload and watch folder support
- parsing for CSV, XLSX, and selected PDF extraction flows
- field mapping templates
- confidence scoring
- approval queue for low confidence imports
- import history and rollback awareness
- duplicate detection
- reconciliation dashboard

### Problems Solved
- no ERP API
- manual rekeying
- risky data imports with no traceability

### Enhancements
- side by side import diff review
- what changed from last vendor file analyzer
- import health score by source
- hard stop rules for low confidence critical imports

## 10.2 Event Timeline and Audit Log

### Goal
Every major business object needs one trustworthy history.

### Core Features
- append only event store for orders, stops, pickups, receivings, claims, collections, quotes, vendor changes, role changes, permission changes, approvals, and feature flag changes
- actor, timestamp, entity type, entity id, before or after summary, source, note
- timeline views inside each module
- cross entity activity feed

### Problems Solved
- who changed this and when
- impossible dispute reconstruction
- poor management visibility
- no safe governance of access changes

### Enhancements
- event replay for route and order lifecycle
- operational handoff summaries generated from event history

## 10.3 Exception Engine

### Goal
Stop making users hunt for problems.

### Exception Categories
- late order
- route overload
- delivery failure
- missing POD
- COD short
- backorder risk
- receiving discrepancy
- invoice mismatch
- price margin risk
- promise due today
- dispute overdue
- customer on hold with urgent order
- unauthorized access attempt
- approval request overdue
- import batch blocked

### Core Features
- centralized exception queue
- priority score
- owner assignment
- due time
- status and resolution note

### Problems Solved
- issues scattered across modules
- no triage system

## 10.4 Notifications and Communication

### Goal
Send the right message to staff and customers at the right moment.

### Core Features
- internal alerts
- SMS and email templates
- customer delivery window messages
- pickup ready messages
- failed stop notifications
- promise due reminders for AR
- vendor discrepancy notices
- approval request notifications
- feature rollout notices if needed

### Enhancements
- communication timeline on customer and order record
- template variables and rules engine

## 10.5 Universal Search

### Goal
Any user can find any important record in seconds.

### Search Targets
- order number
- invoice number
- PO
- customer name
- phone number
- address
- SKU
- vendor item
- truck
- route
- estimate
- contact
- user
- approval request
- exception

### Enhancements
- command palette for quick actions
- recent items and pinned records

## 10.6 Reporting and Analytics

### Goal
Convert operating data into useful management signals.

### Required Reports
- on time delivery
- route profitability
- order cycle time
- pickup wait time
- receiving discrepancy rate
- vendor fill rate
- price change impact
- collector performance
- promise kept rate
- estimate conversion
- dormant account recovery
- damage frequency
- cycle count accuracy
- approval turnaround time
- role usage and access audit
- feature adoption by branch

## 11. Data Model Requirements

Core entities required from day one:
- User
- UserProfile
- Role
- Permission
- RolePermission
- UserRoleAssignment
- AccessScope
- ApprovalPolicy
- ApprovalRequest
- ApprovalStep
- FeatureFlag
- FeatureFlagAssignment
- UserPreference
- BranchSetting
- SecurityEvent
- AuditEvent
- Location
- Customer
- CustomerContact
- CustomerTag
- Product
- Vendor
- VendorPrice
- ProductCostHistory
- InventoryLocationBalance
- InventoryLengthBalance
- Order
- OrderItem
- OrderEvent
- Truck
- Route
- RouteStop
- DeliveryProof
- CODCollection
- PickupTicket
- YardTask
- ReceivingRecord
- ReceivingLine
- VerificationReview
- VendorClaim
- PurchaseOrder
- PurchaseOrderLine
- VendorInvoice
- MatchException
- Quote
- QuoteLine
- CollectionAccount
- CollectionActivity
- PromiseToPay
- Dispute
- PaymentPlan
- Exception
- ImportJob
- ImportChange
- Attachment

## 12. Non Functional Requirements

### Performance
- main workboards must load fast enough for operational use
- search should feel instant
- mobile workflows must remain usable on weak signal

### Security
- role based access control
- permission by action
- scoped access rules
- field level restrictions for sensitive finance data
- audit logs on important writes
- audit logs on access changes
- secure file access
- secure export controls
- optional two factor auth for high risk roles

### Reliability
- imports must be traceable and replay safe
- critical workflows need transactional writes
- soft failure handling for partial sync issues
- permission checks must be centralized, not duplicated loosely in UI

### Mobile
- driver, yard, receiving, and pickup workflows must be mobile first
- installable PWA acceptable for V1 if native app not yet justified

### Observability
- structured logs
- import error logs
- route failure diagnostics
- queue monitoring
- approval bottleneck monitoring
- feature adoption monitoring

## 13. Suggested Tech Stack

This is the stack I would tell Cloud Code to build unless there is a hard reason not to.

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- component system with strict design tokens

### Backend
- Next.js server routes or separate API layer if scale requires it
- Prisma ORM
- PostgreSQL
- Redis for queues, caching, and live task feeds

### Files and Media
- object storage for uploads, POD photos, receiving photos, claims, and documents

### Realtime
- websockets or server sent updates for dispatch, yard, and command center views

### Maps and Routing
- Mapbox or equivalent for routing and geocoding

### Notifications
- Twilio for SMS
- transactional email service

### OCR / AI / Verification
- modular service layer, not hardcoded into UI
- use AI only where confidence and review flows exist

### Auth
- role based auth with session management and device aware mobile flows
- policy engine for permission, approval, and feature toggle evaluation

## 14. V1 Build Order

Build in this sequence.

### Phase 1 Foundation
- auth and identity
- roles, permissions, scopes, feature flags, and preferences
- design system
- core layout and navigation
- universal search shell
- event model and exception model
- basic customer, product, vendor, order models

### Phase 2 Access and Configuration Layer
- role management UI
- permission set UI
- branch setting UI
- feature flag UI
- approval policy engine
- audit views for access changes

### Phase 3 Orders and Dispatch Core
- order board
- order detail
- readiness logic
- truck planner
- route assignment
- dispatch log

### Phase 4 Driver and Delivery
- driver route
- stop execution
- POD
- COD
- route summary

### Phase 5 Pickup and Yard
- pickup queue
- yard task queue
- loading queue
- bay status

### Phase 6 Receiving and Verification
- PO receiving
- discrepancy queue
- photo capture
- vendor claim flow

### Phase 7 Collections and Credit
- aging dashboard
- assignment and notes
- promises and disputes
- hold recommendation

### Phase 8 Pricing and Purchasing
- vendor price imports
- cost change center
- quote risk
- RFQ and PO workflows
- three way match

### Phase 9 CRM and Revenue Recovery
- customer 360
- estimate follow up
- dormant and cross sell flows

### Phase 10 Import Bridge and Reconciliation
- import jobs
- mapping templates
- low confidence review
- diff and reconciliation dashboards

### Phase 11 Reporting and Command Center
- management dashboard
- exception center
- KPI reporting
- access and approval analytics

## 15. Features Missing From the Existing Direction That Should Be Added

These are the biggest adds I would require in a greenfield rebuild:

1. Unified exception center  
There must be one place to attack late, blocked, risky, and failed work.

2. Unified event backbone  
Every object needs one history. This must include governance changes, not just operational changes.

3. Receiving discrepancy center  
Receiving must have its own queue, evidence model, and AP hold workflow.

4. Route profitability  
Do not stop at route assignment. Score each route by financial quality and capacity quality.

5. Order state machine enforcement  
No loose status changes. All major transitions need rules and side effects.

6. Import reconciliation as a first class module  
Imports are not background plumbing. In this business, they are mission critical.

7. Daily close workflow  
End of day must reconcile deliveries, COD, unresolved stops, pickup leftovers, receiving discrepancies, and collector promises.

8. Customer 360 with operational history  
Not just sales notes. Include order, delivery, issue, payment, and dispute context.

9. Vendor claim management  
Shorts, damages, and invoice mismatches need a structured vendor issue workflow.

10. Service level tracking  
Track promised versus actual for pickups, deliveries, receivings, and dispute resolution.

11. Real access and governance layer  
The system must support multi role users, action based permissions, scopes, approvals, feature flags, branch settings, and workspace customization.

12. Field level visibility and policy enforcement  
Not everyone should see costs, balances, profitability, disputes, or sensitive notes.

## 16. Daily Close Requirements

This must exist because operational systems break down without it.

### Daily Close Must Include
- uncompleted stops
- COD expected vs collected vs short
- missing PODs
- pickup tickets still open
- orders loaded but not dispatched
- receivings pending review
- AP holds created today
- promises to pay due today and missed
- unresolved exceptions by owner
- approvals requested today and still pending
- access changes made today
- unusual exports or sensitive actions taken today

## 17. Acceptance Criteria for the Product

The product is successful when:
- dispatch can run a full day without paper
- drivers can complete delivery proof and COD inside the app
- yard staff can see and complete prep and loading tasks digitally
- receiving can document shorts and damages with photos and workflow control
- collections can track every promise and dispute in one place
- pricing can show which quotes are exposed to vendor cost changes
- purchasing can compare vendor quotes and reconcile PO, receipt, and invoice
- management can open one dashboard and see the business state clearly
- the system can ingest ERP exports without corrupting operations
- each employee can be restricted to exactly the right level of access
- unfinished or branch specific features can be toggled safely
- approvals for sensitive actions are enforced and auditable

## 18. Cloud Code Build Rules

Give Cloud Code these rules with the PRD.

- Build from scratch. Do not assume any existing repo structure is correct.
- Use this PRD as source of truth.
- Create `PLAN.md`, `PROGRESS.md`, `DECISIONS.md`, `DATA-MODEL.md`, `API-SPECS.md`, `PERMISSIONS-MATRIX.md`, and `APPROVAL-POLICIES.md` first.
- Implement one module at a time.
- No fake screens with dead actions.
- Every write action needs validation and audit events.
- Every access change needs an audit event.
- Every module must expose its exceptions.
- Every status change must be explicit.
- Every sensitive action must go through policy evaluation.
- Seed realistic sample data for building supply workflows.
- Keep business rules in service layers, not UI components.
- Do not build AI first. Build operational control first.
- Add AI only behind review queues and confidence thresholds.
- Build role management, permissioning, feature flags, and branch settings before advanced operational modules.

## 19. First Deliverables Cloud Code Should Produce

1. system architecture doc
2. data model draft
3. event model and exception model
4. permission matrix draft
5. approval policy draft
6. feature flag and settings model
7. API specification by module
8. wireframe map of modules and tabs
9. phased implementation plan
10. seed data plan
11. risk register
12. rollout assumptions by role and branch

## 20. Final Direction

This product should not be framed as software for deliveries.
It should be framed as:

**The operational control layer for a wholesale building materials distributor running on a legacy ERP.**

That framing is stronger because it captures dispatch, delivery, pickup, yard, receiving, pricing, purchasing, collections, customer recovery, and governance inside one system.
