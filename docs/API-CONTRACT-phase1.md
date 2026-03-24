# API Contract Phase 1

## Overview

Tai lieu nay mo ta REST API contract cho skeleton backend `NestJS` trong `backend/src`.

Base URL:
- `/api/v1`

Response envelope thanh cong:

```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-03-15T00:00:00.000Z"
}
```

Response envelope loi:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed"
  },
  "path": "/api/v1/employees",
  "timestamp": "2026-03-15T00:00:00.000Z"
}
```

## Auth

### POST `/auth/login`

Muc dich:
- Dang nhap bang email cong ty va mat khau

Request:

```json
{
  "email": "admin@hrm.local",
  "password": "Admin@123456"
}
```

Response:

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": "uuid",
    "email": "admin@hrm.local",
    "employeeId": "uuid",
    "roles": ["ADMIN"]
  }
}
```

### POST `/auth/refresh`

Muc dich:
- Lay access token moi tu refresh token

Request:

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### GET `/auth/me`

Muc dich:
- Lay thong tin user hien tai, roles, permissions

## Employees

### GET `/employees/me`

Muc dich:
- Lay ho so nhan vien cua user dang dang nhap

### GET `/employees`

Query params:
- `page`
- `limit`
- `search`

Muc dich:
- Lay danh sach nhan vien

### GET `/employees/:id`

Muc dich:
- Lay chi tiet 1 nhan vien

### POST `/employees`

Muc dich:
- Tao ho so nhan vien moi

Request body:

```json
{
  "companyId": "uuid",
  "branchId": "uuid",
  "employeeCode": "EMP001",
  "companyEmail": "employee@company.vn",
  "firstName": "An",
  "lastName": "Nguyen",
  "currentDepartmentId": "uuid",
  "currentPositionId": "uuid",
  "startDate": "2026-03-15"
}
```

## Attendance

### GET `/attendance/me`

Muc dich:
- Lay attendance dashboard cua chinh user dang dang nhap
- Gom records gan day va overtime requests cua minh

### GET `/attendance/me/monthly-summary?year=2026&month=3`

Muc dich:
- Lay tong hop attendance theo thang cua chinh user

### GET `/attendance/manager/approvals`

Muc dich:
- Lay dashboard manager cho overtime pending va team attendance gan day

### POST `/attendance/me/check-in`

Muc dich:
- Employee check-in cho ngay hien tai

### POST `/attendance/me/check-out`

Muc dich:
- Employee check-out cho ngay hien tai

### GET `/attendance/records`

Muc dich:
- Lay danh sach bang cong

### GET `/attendance/overtime-requests`

Muc dich:
- Lay danh sach OT request dang cho duyet

### POST `/attendance/overtime-requests`

Muc dich:
- Tao OT request

Request body:

```json
{
  "employeeId": "uuid",
  "workDate": "2026-03-15",
  "startAt": "2026-03-15T18:30:00.000Z",
  "endAt": "2026-03-15T21:00:00.000Z",
  "totalMinutes": 150,
  "overtimeDayType": "WEEKDAY",
  "requestedNote": "Deploy support"
}
```

### PATCH `/attendance/overtime-requests/:id/decision`

Muc dich:
- Manager hoac HR approve/reject OT request

Request body:

```json
{
  "status": "APPROVED",
  "approvedMinutes": 120,
  "note": "Approved by manager"
}
```

## Leave

### GET `/leave/me`

Muc dich:
- Lay leave dashboard cua chinh user dang dang nhap
- Gom leave balances va leave requests gan day

### GET `/leave/manager/approvals`

Muc dich:
- Lay danh sach don nghi pending cua team manager

### PATCH `/leave/requests/:id/cancel`

Muc dich:
- Employee hoac HR huy don nghi theo rule hien tai

### GET `/leave/requests`

Muc dich:
- Lay danh sach don nghi

### GET `/leave/balances/:employeeId`

Muc dich:
- Lay so du phep cua 1 nhan vien

### POST `/leave/requests`

Muc dich:
- Tao don nghi

Request body:

```json
{
  "employeeId": "uuid",
  "leaveTypeId": "uuid",
  "fromDate": "2026-03-20",
  "toDate": "2026-03-21",
  "requestedDays": 2,
  "reason": "Family trip"
}
```

### PATCH `/leave/requests/:id/decision`

Muc dich:
- Manager hoac HR approve/reject don nghi

Request body:

```json
{
  "status": "APPROVED",
  "note": "Approved"
}
```

## Payroll

### GET `/payroll/periods`

Muc dich:
- Lay danh sach payroll periods

### GET `/payroll/me`

Muc dich:
- Lay danh sach payslip cua chinh user dang dang nhap

### GET `/payroll/periods/:periodId/payslips`

Muc dich:
- Lay payslip theo payroll period

### POST `/payroll/periods`

Muc dich:
- Tao payroll period

### PATCH `/payroll/periods/:periodId/lock`

Muc dich:
- Khoa payroll period

### PATCH `/payroll/periods/:periodId/unlock`

Muc dich:
- Mo khoa payroll period

### PATCH `/payroll/periods/:periodId/publish`

Muc dich:
- Publish payroll period

### POST `/payroll/periods/:periodId/run-draft`

Muc dich:
- Sinh payslip draft tu contract, attendance, approved OT, unpaid leave, insurance, tax

## Notifications

### GET `/notifications/me`

Muc dich:
- Lay danh sach in-app notifications cua user dang dang nhap

Query params:
- `page`
- `limit`

### GET `/notifications/me/unread-count`

Muc dich:
- Lay so thong bao chua doc cua user hien tai

### PATCH `/notifications/me/:id/read`

Muc dich:
- Danh dau 1 thong bao la da doc

### PATCH `/notifications/me/read-all`

Muc dich:
- UI action de danh dau tat ca thong bao chua doc cua user hien tai la da doc

Response:

```json
{
  "updatedCount": 8
}
```

### PATCH `/notifications/me/read`

Muc dich:
- Danh dau nhieu thong bao la da doc, hoac tat ca thong bao chua doc

Request body:

```json
{
  "notificationIds": ["uuid-1", "uuid-2"]
}
```

## Manager

### GET `/manager/team`

Muc dich:
- Lay danh sach nhan vien thuoc team cua manager hien tai

### GET `/manager/team/:employeeId`

Muc dich:
- Lay ho so chi tiet cua 1 thanh vien trong team de hien thi manager team detail page
- Gom profile, contract active, leave balances, recent attendance, recent leave requests, recent overtime requests

### GET `/manager/team/attendance?year=2026&month=3`

Muc dich:
- Lay snapshot attendance theo thang cua team manager

### GET `/manager/team/approvals`

Muc dich:
- Lay queue don nghi va OT dang cho manager xu ly

## Reports

### GET `/reports/hr-summary`

Muc dich:
- Lay thong ke tong quan nhan su cho HR dashboard

Query params:
- `departmentId?`
- `employmentStatus?`

### GET `/reports/hr-summary/export.csv`

Muc dich:
- Export CSV cho HR summary hien tai theo filter dang chon tren dashboard

### GET `/reports/attendance-summary?year=2026&month=3`

Muc dich:
- Lay thong ke attendance theo thang cho HR dashboard

Query params:
- `year`
- `month`
- `departmentId?`
- `attendanceStatus?`

### GET `/reports/attendance-summary/export.csv?year=2026&month=3`

Muc dich:
- Export CSV attendance detail theo filter dashboard

### GET `/reports/leave-summary?year=2026&month=3`

Muc dich:
- Lay thong ke leave theo thang cho HR dashboard

Query params:
- `year`
- `month`
- `departmentId?`
- `leaveTypeId?`
- `status?`

### GET `/reports/leave-summary/export.csv?year=2026&month=3`

Muc dich:
- Export CSV leave detail theo filter dashboard

### GET `/reports/payroll-summary?year=2026&month=3`

Muc dich:
- Lay thong ke payroll theo thang cho HR dashboard

Query params:
- `year`
- `month`
- `departmentId?`
- `periodStatus?`
- `payslipStatus?`

### GET `/reports/payroll-summary/export.csv?year=2026&month=3`

Muc dich:
- Export CSV payroll detail theo filter dashboard

## Health

### GET `/health`

Muc dich:
- Health check cho service

## Notes

- Hien tai day la `implementation skeleton`, chua phai full business logic
- Auth da co `login`, `refresh`, `me`, JWT signing, role guard, permission guard
- Attendance va leave da co approval endpoints
- Payroll da co create, lock, unlock, publish period endpoints
- Attendance da co `check-in/check-out` self-service
- Leave da co `cancel` flow
- Payroll da co `run draft` flow de sinh payslip nhap
- Attendance da co `monthly summary` va manager approval dashboard
- Leave da co manager approval dashboard
- Payroll da co employee self-service payslip endpoint
- Don nghi moi se tu dong tao approval step cho manager neu nhan vien da duoc gan manager co user account
- Approve/reject leave, approve/reject OT, lock/unlock payroll period deu co audit log
- Leave approve/reject, OT approve/reject, va payroll publish se tao in-app notification
- Notifications da co API `list`, `unread count`, `mark one read`, `mark many read`, va `mark all read`
- Manager da co team endpoints cho danh sach team, detail tung nhan vien, attendance snapshot, va approval queue
- HR dashboard da co report endpoints cho HR summary, attendance, leave, payroll summary, va CSV export theo filter
- Cac route module dang duoc noi truc tiep vao PrismaService de tao nen implementation ban dau
- Approval flow, RBAC guard, va service rules chi tiet se duoc bo sung o buoc implement tiep theo
