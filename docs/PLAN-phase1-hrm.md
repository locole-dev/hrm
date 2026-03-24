# PLAN Phase 1 HRM

## Overview

Tai lieu nay la plan chi tiet cho Phase 1 cua du an HRM.

Muc tieu cua Phase 1:
- Dua vao van hanh mot web app HRM noi bo
- Ho tro cac nghiep vu cot loi: nhan vien, co cau to chuc, cham cong, nghi phep, luong co ban
- Tao nen du lieu va kien truc de mo rong sang Phase 2

Gia dinh:
- Frontend: React
- Backend: Node.js
- Kieu trien khai: web app responsive
- Uu tien MVP truoc, toi uu va mo rong sau

## Project Type

`WEB + BACKEND`

Frontend la ung dung React admin/self-service.
Backend la API Node.js phuc vu nghiep vu HRM.

## Success Criteria

- HR co the quan ly ho so nhan vien, phong ban, chuc vu, hop dong
- Employee co the dang nhap, xem ho so, cham cong, tao don nghi
- Manager co the duyet don nghi cua team
- Payroll co the tong hop cong, phep, va tao bang luong co ban
- He thong co RBAC, audit log co ban, va export du lieu can thiet
- Co kha nang mo rong them recruitment va performance o Phase 2 ma khong doi kien truc chinh

## Recommended Tech Stack

### Frontend
- React
- Vite
- React Router
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod

### Backend
- Node.js
- NestJS
- Prisma
- PostgreSQL
- Redis
- BullMQ
- JWT + Refresh Token

### Infrastructure
- Docker
- Docker Compose
- S3-compatible storage cho tep dinh kem

## Why This Stack

- React + Vite phu hop dashboard va form-heavy app
- NestJS giup chia module ro rang cho HRM
- Prisma va PostgreSQL phu hop du lieu quan he, migration, va bao cao
- Redis + BullMQ ho tro notification, export, va batch payroll

## Scope Breakdown

### In Scope
- Auth va RBAC
- Employee management
- Organization structure
- Attendance
- Leave management
- Payroll co ban
- Reporting co ban
- Notification co ban

### Out of Scope
- Recruitment
- Onboarding
- Performance review
- Learning and development
- Mobile app rieng
- Workflow builder dong

## User Roles

- `Super Admin`
- `HR`
- `Manager`
- `Payroll`
- `Employee`

## Proposed File Structure

```text
frontend/
  src/
    app/
    components/
    features/
      auth/
      employees/
      departments/
      attendance/
      leave/
      payroll/
      reports/
    layouts/
    lib/
    pages/
    routes/
    types/

backend/
  src/
    modules/
      auth/
      users/
      employees/
      departments/
      positions/
      contracts/
      attendance/
      shifts/
      leave/
      payroll/
      reports/
      notifications/
      audit/
    common/
    config/
  prisma/

docs/
  HRM-PHASES.md
  PLAN-phase1-hrm.md
```

## High-Level Architecture

### Frontend Areas
- Auth pages
- Admin dashboard
- HR operational pages
- Manager approval pages
- Employee self-service pages

### Backend Domains
- Auth va permission
- Employee master data
- Attendance va leave rules
- Payroll processing
- Reporting va audit

### Core Data Entities
- User
- Role
- Permission
- Employee
- Department
- Position
- Contract
- AttendanceRecord
- Shift
- LeaveRequest
- LeaveBalance
- PayrollPeriod
- PayrollItem
- Payslip
- Notification
- AuditLog

## Milestones

### Milestone 1: Foundation
- Repo structure
- Frontend app bootstrap
- Backend app bootstrap
- Database setup
- Auth skeleton

### Milestone 2: Core HR
- Employee management
- Organization structure
- Contracts
- RBAC completion

### Milestone 3: Daily Operations
- Attendance
- Leave workflow
- Manager approvals
- Basic notifications

### Milestone 4: Payroll and Reports
- Payroll period
- Payroll calculation base
- Payslip
- Reports and export

## Task Breakdown

### T01
- `task_id`: T01
- `name`: Define detailed Phase 1 business rules
- `agent`: product-manager
- `skills`: brainstorming
- `priority`: P0
- `dependencies`: none
- `INPUT -> OUTPUT -> VERIFY`:
  - Input: Phase scope, company HR process assumptions
  - Output: Approved business rules for attendance, leave, payroll
  - Verify: Rules reviewed and signed off before schema design

### T02
- `task_id`: T02
- `name`: Design database schema for Phase 1
- `agent`: database-architect
- `skills`: database-design
- `priority`: P0
- `dependencies`: T01
- `INPUT -> OUTPUT -> VERIFY`:
  - Input: Business rules from T01
  - Output: ERD, Prisma schema, migration plan
  - Verify: Entities cover all in-scope modules with clear relations

### T03
- `task_id`: T03
- `name`: Bootstrap backend Node.js service
- `agent`: backend-specialist
- `skills`: api-patterns
- `priority`: P0
- `dependencies`: T02
- `INPUT -> OUTPUT -> VERIFY`:
  - Input: Module list, database direction
  - Output: Backend app skeleton with config, modules, health endpoint
  - Verify: App boots locally and connects to database

### T04
- `task_id`: T04
- `name`: Bootstrap frontend React app
- `agent`: frontend-specialist
- `skills`: frontend-design
- `priority`: P0
- `dependencies`: none
- `INPUT -> OUTPUT -> VERIFY`:
  - Input: Role-based app requirements
  - Output: React app with routing, layout, auth shell, design tokens
  - Verify: Frontend boots locally and renders app shell

### T05
- `task_id`: T05
- `name`: Implement authentication and RBAC
- `agent`: security-auditor
- `skills`: clean-code
- `priority`: P0
- `dependencies`: T03, T04
- `INPUT -> OUTPUT -> VERIFY`:
  - Input: Roles, protected routes, API access rules
  - Output: Login flow, token flow, permission guards
  - Verify: Each role sees only allowed screens and APIs

### T06
- `task_id`: T06
- `name`: Build employee and organization modules
- `agent`: backend-specialist + frontend-specialist
- `skills`: api-patterns, frontend-design
- `priority`: P1
- `dependencies`: T02, T05
- `INPUT -> OUTPUT -> VERIFY`:
  - Input: Employee fields and org hierarchy
  - Output: CRUD APIs and UI for employee, department, position, contract
  - Verify: HR can create, edit, search, and filter employees

### T07
- `task_id`: T07
- `name`: Build attendance module
- `agent`: backend-specialist + frontend-specialist
- `skills`: api-patterns, frontend-design
- `priority`: P1
- `dependencies`: T05, T06
- `INPUT -> OUTPUT -> VERIFY`:
  - Input: Attendance rules, shift rules
  - Output: Check-in/out flow, attendance records, monthly summary UI
  - Verify: Attendance totals match expected rules for sample cases

### T08
- `task_id`: T08
- `name`: Build leave management module
- `agent`: backend-specialist + frontend-specialist
- `skills`: api-patterns, frontend-design
- `priority`: P1
- `dependencies`: T05, T06
- `INPUT -> OUTPUT -> VERIFY`:
  - Input: Leave types, approval rules
  - Output: Leave request flow, approval screens, leave balance handling
  - Verify: Employee can submit and manager can approve or reject

### T09
- `task_id`: T09
- `name`: Build payroll base module
- `agent`: backend-specialist + database-architect
- `skills`: api-patterns, database-design
- `priority`: P1
- `dependencies`: T07, T08
- `INPUT -> OUTPUT -> VERIFY`:
  - Input: Payroll formula assumptions, attendance summary, deductions
  - Output: Payroll period, payroll items, payslip generation base
  - Verify: Sample payroll run matches expected outputs

### T10
- `task_id`: T10
- `name`: Add reports, export, and audit log
- `agent`: backend-specialist
- `skills`: api-patterns
- `priority`: P2
- `dependencies`: T06, T07, T08, T09
- `INPUT -> OUTPUT -> VERIFY`:
  - Input: Required HR reports and audit fields
  - Output: Summary reports, export endpoints, audit records
  - Verify: HR can export monthly data and trace important changes

### T11
- `task_id`: T11
- `name`: Add notifications and background jobs
- `agent`: backend-specialist
- `skills`: api-patterns
- `priority`: P2
- `dependencies`: T08, T09
- `INPUT -> OUTPUT -> VERIFY`:
  - Input: Notification triggers and batch jobs
  - Output: Reminders, approval notifications, payroll generation jobs
  - Verify: Triggered events create expected notifications

### T12
- `task_id`: T12
- `name`: Testing and release hardening
- `agent`: test-engineer
- `skills`: testing-patterns
- `priority`: P2
- `dependencies`: T05, T06, T07, T08, T09, T10, T11
- `INPUT -> OUTPUT -> VERIFY`:
  - Input: Working modules
  - Output: Test plan, critical automated tests, UAT checklist
  - Verify: Critical Phase 1 journeys pass before release

## Suggested Delivery Sequence

1. T01-T04
2. T05
3. T06
4. T07-T08
5. T09
6. T10-T11
7. T12

## Key Risks and Mitigations

### Risk 1: Business rules may change mid-build
- Mitigation: Freeze Phase 1 rules after T01 and manage changes through changelog

### Risk 2: Payroll complexity grows too early
- Mitigation: Keep payroll in Phase 1 at formula-based baseline only

### Risk 3: Sensitive HR data exposure
- Mitigation: Implement RBAC, audit log, and secure defaults before module rollout

### Risk 4: Scope creep from Phase 2 modules
- Mitigation: Explicitly keep recruitment and performance out of Phase 1

## Phase X Verification

- [ ] Business rules approved
- [ ] Schema reviewed
- [ ] Frontend build passes
- [ ] Backend build passes
- [ ] Auth and RBAC verified by role
- [ ] Core employee flows verified
- [ ] Attendance flows verified
- [ ] Leave approval flows verified
- [ ] Payroll sample run verified
- [ ] Reports export verified
- [ ] Audit log verified
- [ ] Critical tests pass

## Implementation Notes

- Bat dau tu MVP va giu schema du mo rong Phase 2
- Uu tien role `HR`, `Manager`, `Employee` truoc
- Tranh tu dong hoa payroll qua som neu rule thuc te chua ro

## Next Step

Sau khi team dong y plan nay, buoc tiep theo nen la:
1. Chot business rules chi tiet cho T01
2. Tao schema database cho Phase 1
3. Khoi tao skeleton frontend va backend
