# PRD — Organization Map, Responsibility Matrix, and Workforce Coverage Module

## Product Name
Organization Map

Alternative internal names:
- Org Map
- Responsibility Map
- Workforce Map
- Accountability Map

## 1. Purpose

Build a dedicated module inside the operations platform that maps the business from A to Z across departments, roles, responsibilities, recurring tasks, approvals, coverage, and staffing needs.

This module must go beyond a visual org chart.

It must allow leadership to:
- see the organizational structure
- define every major job and task in the business
- assign task ownership to roles and people
- detect unowned work
- detect overloaded people
- detect missing capabilities
- detect weak backup coverage
- identify where hiring is needed
- control who can view or edit the org structure
- connect role ownership to real system access and permissions

This module becomes the company’s operational responsibility system.

## 2. Why This Module Is Needed

A normal org chart only shows reporting lines.

That is not enough for a real operations-heavy company.

Clear role definitions and job descriptions provide employees and managers with a reference for expectations and performance. RACI-style responsibility mapping is widely used to clarify accountability across tasks and deliverables. A skills matrix is a common starting point for finding capability gaps and training needs during operational change.

For this business specifically, every employee will likely have a system login tied to their role. That means organizational structure, task ownership, permissions, approvals, and workspace access should be connected, not managed in separate disconnected tools.

## 3. Core Goal

Create one central module where the company can map:
- departments
- teams
- roles
- people
- recurring operational tasks
- approvals
- task ownership
- backup ownership
- staffing gaps
- training gaps
- access requirements
- hiring needs

The module must support both:
1. organizational visibility
2. operational responsibility management

## 4. Main Outcomes

Leadership should be able to answer:
- Who owns dispatch board accuracy?
- Who approves price overrides?
- Who handles vendor claims?
- Who is responsible for pickup readiness?
- Which tasks have no owner right now?
- Which employee is overloaded?
- Which branch has no backup receiver?
- Which roles require access to margin data?
- Which tasks depend on one person only?
- Which responsibilities should trigger a hire?
- Which tasks are assigned to someone who no longer has the correct permission?
- Which tasks are branch-specific and which are company-wide?

## 5. Users

### Primary users
- Owner
- General Manager
- Branch Manager
- Operations Manager
- HR / Office Leadership
- Department Heads

### Secondary users
- Team Leads
- Supervisors
- Department Managers

### Limited users
- Individual employees viewing:
  - their own role card
  - their assigned responsibilities
  - their coverage obligations
  - their approval authority
  - their training requirements
  - their backup responsibilities

## 6. Scope

This module is not a payroll system.

This module is not a full HRIS.

This module is an operational organization and accountability system.

It must focus on:
- organizational structure
- role definitions
- task ownership
- responsibility mapping
- staffing and coverage analysis
- access and permission implications
- hiring and workload visibility

## 7. Key Concepts

### 7.1 Organizational structure
The reporting map of the business:
- company
- region if needed
- branch
- department
- team
- role
- employee

### 7.2 Responsibility map
The map of what work exists and who owns it.

### 7.3 Task library
A master catalog of business tasks from A to Z.

### 7.4 Role template
A reusable definition of a position including:
- purpose
- core responsibilities
- approvals
- required skills
- required permissions
- branch applicability
- KPIs
- coverage needs

### 7.5 Assignment layer
Who currently owns the work:
- primary owner
- secondary owner
- backup owner
- approver
- consulted
- informed

### 7.6 Coverage
Whether the business has enough people and backups to keep the work running.

### 7.7 Gap detection
The system’s identification of:
- unassigned tasks
- overloaded people
- missing backups
- missing permissions
- missing skills
- hiring needs

## 8. Product Principles

1. Do not reduce this to a decorative org chart.
2. Every visible role should connect to real responsibilities.
3. Every responsibility should have an owner, a status, and a scope.
4. The system should reveal organizational gaps, not hide them.
5. Access control and org design should be linked.
6. Branch differences must be supported.
7. Personal names and role templates must stay separate.
8. Hiring signals must come from actual gaps and workload.
9. Employees should only see what matches their visibility permissions.
10. Changes to role structure, permissions, and critical assignments must be audited.

## 9. Module Sections

### 9.1 Org Chart View
Purpose:
Visualize reporting structure and organization hierarchy.

Shows:
- company structure
- branches
- departments
- teams
- managers
- employees
- open roles
- vacant roles
- temporary coverage

Capabilities:
- expand/collapse hierarchy
- filter by branch
- filter by department
- filter by active/inactive roles
- show vacant positions
- show overloaded teams
- show role cards
- show direct reports
- show dotted-line relationships if needed

### 9.2 Role Catalog
Purpose:
Define reusable role templates.

Each role record should include:
- role title
- department
- branch scope
- summary
- mission of the role
- standard responsibilities
- recurring tasks
- required skills
- required system permissions
- approval rights
- KPIs
- required certifications if any
- default dashboard
- feature access defaults
- backup expectations
- headcount target
- status: active, draft, deprecated

### 9.3 Employee Assignment View
Purpose:
Show which person is currently assigned to which role and responsibilities.

Each employee record should show:
- name
- branch
- department
- manager
- active roles
- assigned tasks
- approvals they can issue
- permissions summary
- backup responsibilities
- current workload score
- training gap status
- cross-training status
- exceptions or conflicts

### 9.4 Task Library
Purpose:
Define every major business task from A to Z.

Task types may include:
- daily tasks
- weekly tasks
- monthly tasks
- event-based tasks
- approval tasks
- exception handling tasks
- seasonal tasks
- branch-specific tasks

Each task should contain:
- task name
- department
- process area
- detailed description
- why the task exists
- trigger
- frequency
- SLA or due expectation
- primary owner role
- backup role
- approver role if needed
- branch applicability
- required permissions
- required skills
- linked SOP or guide
- linked system module
- linked KPI
- risk if unowned
- status: active, draft, retired

### 9.5 Responsibility Matrix View
Purpose:
Map tasks to roles and people using a structured framework.

Recommended model:
- Responsible
- Accountable
- Consulted
- Informed
- Backup
- Permission Fit
- Skill Fit

### 9.6 Coverage and Gap Analysis
Purpose:
Reveal operational weak points.

The system should automatically flag:
- task has no owner
- task has no backup
- employee owns too many critical tasks
- one person is single point of failure
- role is missing in a branch
- required skill not present
- required approval path not staffed
- permission mismatch between assigned task and assigned user
- role template exists but no assigned person
- employee doing work outside assigned role
- branch workload exceeds current headcount

### 9.7 Hiring and Headcount Planning
Purpose:
Turn detected gaps into staffing actions.

Should support:
- open role creation
- role justification
- missing task coverage summary
- estimated urgency
- branch-specific need
- impact if not filled
- temporary reassignment options
- cross-train instead of hire option
- hire recommendation notes

### 9.8 Access and Permission Alignment
Purpose:
Tie org structure to system access.

For each role and employee, show:
- required permissions
- current permissions
- missing permissions
- excess permissions
- feature flags enabled
- approval rights
- field visibility level

### 9.9 Workspace and Personal View
Purpose:
Let each employee understand their role in plain terms.

Each person’s personal view should show:
- my manager
- my role(s)
- my responsibilities
- my recurring tasks
- my approvals
- my backup obligations
- my KPIs
- my training requirements
- my access summary
- my open org exceptions related to me

### 9.10 Reports and Dashboards
Purpose:
Give leadership operational organizational insight.

Core dashboards:
- tasks by department
- tasks without owner
- tasks without backup
- single point of failure map
- overload by employee
- overload by department
- open role map
- permission mismatch report
- branch coverage report
- skills gap report
- cross-training opportunities
- hiring need queue

## 10. Functional Requirements

### 10.1 Organizational hierarchy
The system must support:
- company
- multiple branches
- departments within branches
- teams within departments
- role templates
- employees assigned to one or more roles
- direct manager relationships
- optional dotted-line relationships

### 10.2 Role templates
Users with correct rights must be able to:
- create role templates
- clone templates
- edit responsibilities
- define required permissions
- define required skills
- define branch applicability
- mark a role as vacant
- mark a role as deprecated
- set target headcount by branch

### 10.3 Task catalog
Users with correct rights must be able to:
- create task definitions
- assign frequency
- assign process area
- assign ownership model
- tag task risk level
- mark task as critical or non-critical
- link SOP
- link required permissions
- link required skills
- assign branch scope

### 10.4 Task assignment
The system must allow:
- assign task to role
- assign task to employee
- assign backup
- assign approver
- assign branch-specific variants
- assign temporary coverage
- assign effective dates
- mark assignment as primary or temporary

### 10.5 Automatic checks
The system must automatically check:
- no owner
- no accountable owner
- no backup
- permission mismatch
- skill mismatch
- branch mismatch
- overloaded employee
- too many critical tasks on one person
- vacancy with active tasks
- manager span of control warning if desired

### 10.6 Permission integration
The module must integrate with platform access control to:
- display permission fit
- show missing permissions for assigned responsibilities
- show excess permissions not needed for assigned work
- suggest role permission template updates
- restrict who can edit org structure and assignments

### 10.7 Visibility rules
Not everyone should see the whole map.

Visibility levels:
- company-wide leadership view
- branch-only management view
- department-only view
- own team view
- self-only view
- HR/admin configuration view

### 10.8 Audit
All key changes must be audited:
- org node created
- org node moved
- reporting line changed
- role template changed
- task created
- task reassigned
- backup changed
- permissions alignment changed
- open role created
- employee moved
- assignment removed

## 11. User Stories

### Leadership
- As an owner, I want to see every major responsibility in the business and whether it has an owner, so I can detect gaps fast.
- As a general manager, I want to see which departments rely on one person only, so I can reduce operational risk.
- As a branch manager, I want to see my branch’s uncovered tasks and staffing gaps, so I can reassign work or request hiring.

### Department heads
- As a dispatch manager, I want to define all dispatch tasks and assign backups, so the board runs even when someone is absent.
- As a yard manager, I want to map prep, receiving, loading, damage, and count tasks to people and shifts, so work is not missed.
- As an AR manager, I want collections responsibilities mapped by account book and backup coverage, so follow-up does not collapse when someone is out.

### Employees
- As an employee, I want to see my responsibilities, my backup duties, and my approval rights, so I know what I own.
- As an employee, I want to see only what applies to my role and branch, so the system is clear and not overloaded.

### Admins
- As a systems admin, I want role templates linked to permissions, so task ownership and access remain aligned.
- As an org admin, I want to detect when someone is assigned a critical task but lacks permission, so I can fix access safely.

## 12. Core Workflows

### Workflow 1: Build the business map
1. Create branches
2. Create departments
3. Create teams
4. Create role templates
5. Import or enter employees
6. Assign reporting lines
7. Create task library
8. Link tasks to roles
9. Assign current owners
10. Review gap dashboard

### Workflow 2: Assign responsibilities
1. Open task
2. Set primary owner
3. Set accountable role
4. Set backup owner
5. Set approver if needed
6. Validate skill fit
7. Validate permission fit
8. Save
9. Log audit event
10. Recalculate gaps

### Workflow 3: Detect staffing gap
1. System flags unowned critical task
2. Manager sees task in gap dashboard
3. Manager reviews current role map
4. Manager either:
   - reassigns internally
   - sets temporary backup
   - starts cross-training
   - creates hiring request
5. System logs decision
6. Gap status updates

### Workflow 4: Permission mismatch review
1. Employee assigned to task
2. System checks required permissions
3. Missing access detected
4. Manager sees mismatch
5. Manager either:
   - requests access
   - changes assignee
   - changes role template
   - marks task as blocked
6. Audit event created

### Workflow 5: Coverage planning
1. Manager filters by branch
2. Reviews no-backup tasks
3. Reviews single point of failure report
4. Adds temporary or permanent backups
5. Flags cross-training candidates
6. Updates readiness score

## 13. Data Model

### OrganizationUnit
Fields:
- id
- parent_id
- type: company, region, branch, department, team
- name
- code
- status
- active_from
- active_to

### RoleTemplate
Fields:
- id
- title
- department_id
- branch_scope
- summary
- mission
- default_permissions_profile_id
- default_dashboard
- criticality
- target_headcount
- active

### Employee
Fields:
- id
- name
- email
- employee_code
- branch_id
- department_id
- manager_id
- status
- hire_date
- active

### EmployeeRoleAssignment
Fields:
- id
- employee_id
- role_template_id
- branch_id
- primary_flag
- temporary_flag
- effective_from
- effective_to

### BusinessTask
Fields:
- id
- name
- category
- process_area
- description
- trigger_type
- frequency
- risk_level
- critical_flag
- branch_scope
- required_sop_id
- linked_module
- active

### TaskAssignment
Fields:
- id
- task_id
- role_template_id
- employee_id
- branch_id
- assignment_type: responsible, accountable, backup, consulted, informed
- effective_from
- effective_to
- notes

### Skill
Fields:
- id
- name
- description
- category

### RoleRequiredSkill
Fields:
- id
- role_template_id
- skill_id
- required_level

### EmployeeSkill
Fields:
- id
- employee_id
- skill_id
- current_level
- verified_flag
- last_reviewed_at

### PermissionRequirement
Fields:
- id
- task_id or role_template_id
- permission_key
- scope_requirement

### CoverageGap
Fields:
- id
- gap_type
- severity
- branch_id
- related_task_id
- related_role_id
- related_employee_id
- summary
- recommended_action
- status

### HiringRequest
Fields:
- id
- branch_id
- department_id
- role_template_id
- reason
- linked_gap_id
- urgency
- status

### OrgAuditEvent
Fields:
- id
- event_type
- actor_id
- target_type
- target_id
- before_json
- after_json
- created_at

## 14. Permission Model

Example permissions:
- view_org_chart
- edit_org_chart
- view_role_catalog
- manage_role_catalog
- view_task_library
- manage_task_library
- assign_tasks
- view_gap_analysis
- manage_hiring_requests
- view_permission_alignment
- manage_permission_alignment
- view_company_structure
- view_branch_structure
- view_team_structure
- view_self_role_map
- export_org_reports

Scoping:
- company
- branch
- department
- own team
- self only

## 15. Screens

### 15.1 Organization Map Home
Shows:
- org chart snapshot
- open gaps
- open roles
- high risk single points of failure
- overloaded employees
- branch health summary

### 15.2 Org Chart Explorer
Views:
- hierarchical tree
- filter panel
- role cards
- employee cards
- vacant roles
- reporting lines

### 15.3 Role Catalog
Views:
- table of role templates
- role detail drawer
- required skills
- required permissions
- linked tasks
- linked KPIs
- active branches

### 15.4 Task Library
Views:
- searchable task list
- process area grouping
- critical task filter
- ownership status
- branch applicability
- task detail panel

### 15.5 Responsibility Matrix
Views:
- rows = tasks
- columns = roles or employees
- cells = R, A, C, I, B
- filters by branch, department, category, criticality

### 15.6 Coverage Dashboard
Views:
- no owner
- no backup
- skill gaps
- permission mismatches
- overload
- vacancy impact
- cross-training opportunities

### 15.7 Hiring Planning
Views:
- open gaps that justify hiring
- active open roles
- urgency score
- branch need summary

### 15.8 My Responsibilities
Views:
- my assigned responsibilities
- my backup duties
- my approvals
- my role cards
- my training and access notes

## 16. Metrics

### Adoption metrics
- percentage of active roles documented
- percentage of critical tasks documented
- percentage of critical tasks with owner
- percentage of critical tasks with backup
- percentage of employees with mapped responsibilities

### Quality metrics
- count of unowned critical tasks
- count of no-backup critical tasks
- count of permission mismatches
- count of skill mismatches
- single-point-of-failure count

### Staffing metrics
- open role count
- tasks per employee
- critical tasks per employee
- hiring requests by branch
- cross-training opportunities identified

### Operational health metrics
- coverage score by branch
- coverage score by department
- role clarity completion score
- org map freshness score

## 17. Alerts and Exceptions

The module should create exceptions for:
- critical task without owner
- critical task without backup
- employee assigned without required permission
- employee assigned without required skill
- open role linked to critical tasks
- branch missing mandatory role
- too many critical tasks on one person
- manager span threshold exceeded if enabled

Severity:
- low
- medium
- high
- critical

## 18. Integrations

### Access Control Module
Needed for:
- permission fit
- role-based access
- field visibility
- approval rights

### HR / Employee Directory
Needed for:
- employee master records
- manager relationships
- branch assignment
- active/inactive status

### Task / SOP / Knowledge Module
Needed for:
- task definitions
- linked procedures
- training references

### Recruiting / Hiring Workflow
Needed for:
- open roles
- hiring justification
- gap-driven recruitment

### Reporting Module
Needed for:
- exports
- dashboards
- workforce planning analytics

## 19. Non-Functional Requirements

- fast search across roles, people, and tasks
- support hundreds to thousands of tasks
- support multiple branches
- audit every structural change
- mobile-friendly personal view
- desktop-optimized admin views
- permission-safe visibility
- exportable reports
- version history for role templates and task assignments

## 20. Rollout Plan

### Phase 1
- org structure
- role catalog
- employee role assignment
- org chart view

### Phase 2
- task library
- responsibility matrix
- owner and backup assignment

### Phase 3
- coverage and gap analysis
- permission alignment
- skill alignment

### Phase 4
- hiring planning
- cross-training support
- advanced reports
- alerts and exception workflows

## 21. MVP

MVP must include:
- org chart
- role catalog
- employee assignments
- task library
- responsibility matrix
- owner and backup mapping
- branch filters
- gap dashboard
- permission fit view
- personal “My Responsibilities” page
- audit log

## 22. Future Enhancements

- shift-based assignment
- seasonality-aware staffing
- AI suggestion for likely task owners
- AI suggestion for hiring need detection
- AI identification of overloaded teams
- onboarding workflow from role template
- training plan generation from skills gaps
- simulation mode:
  - what happens if this person leaves
  - what happens if branch volume grows 20%
  - what happens if we add a second shift

## 23. Risks

### Risk: It becomes just another chart
Mitigation:
Tie every role to tasks, permissions, and gaps.

### Risk: Too much setup work
Mitigation:
Provide starter templates by department and role.

### Risk: Managers do not maintain it
Mitigation:
Show value through automatic gap and hiring signals.

### Risk: Access becomes too open
Mitigation:
Use strong visibility scopes and audit logs.

### Risk: Tasks become messy and duplicated
Mitigation:
Use a controlled task library with categories and approval workflow for new task definitions.

## 24. Success Definition

This module is successful when:
- leadership can see exactly who owns what
- every critical task has an owner and backup
- the company can detect missing responsibilities early
- permission mismatches are visible before they create failure
- hiring decisions are based on real uncovered work
- each employee can clearly see their responsibilities
- the business can operate with less ambiguity and fewer single points of failure

## 25. Final Positioning

This should be a dedicated top-level tab in the platform.

Recommended tab names:
- Organization Map
- Workforce Map
- Responsibility Map
- Accountability Map

Best recommendation:
Organization Map
