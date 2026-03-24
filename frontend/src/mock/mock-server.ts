import type {
  AttendanceSummary,
  AttendanceDashboard,
  AttendanceMonthlySummary,
  AttendanceRecord,
  AuthResponse,
  AuthUser,
  DepartmentDetail,
  DepartmentListItem,
  EmployeeListResponse,
  EmployeeProfile,
  HrSummary,
  LeaveBalance,
  LeaveDashboard,
  LeaveRequest,
  LeaveSummary,
  NotificationItem,
  NotificationList,
  OvertimeRequest,
  PayrollSummary,
  Payslip,
  Position,
  TeamApprovalQueues,
  TeamAttendanceSnapshot,
  TeamMemberDetail,
  UnreadCount,
} from "@/types/api";
import { getAccessToken } from "@/lib/storage";

type MockState = {
  users: Array<AuthUser & { password: string }>;
  employees: EmployeeProfile[];
  attendanceRecords: AttendanceRecord[];
  overtimeRequests: OvertimeRequest[];
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  payslips: Payslip[];
  notifications: NotificationItem[];
};

const MOCK_STATE_KEY = "hrm.mockState";
const MOCK_DEPARTMENTS_KEY = "hrm.mockDepartments";
const MOCK_POSITIONS_KEY = "hrm.mockPositions";
const mockYear = 2026;
const mockMonth = 3;

function asIso(value: string) {
  return new Date(value).toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeFilters(params?: Record<string, unknown>) {
  if (!params) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  ) as Record<string, string | number | undefined>;
}

function createInitialState(): MockState {
  const users: MockState["users"] = [
    {
      id: "user-admin",
      email: "admin@hrm.local",
      employeeId: "employee-admin",
      roles: ["ADMIN"],
      permissions: [
        "employees.read",
        "attendance.read",
        "attendance.write",
        "leave.read",
        "leave.write",
        "notifications.read",
        "notifications.write",
        "manager.read",
        "payroll.read",
        "reports.read",
      ],
      password: "Admin@123456",
    },
    {
      id: "user-manager",
      email: "manager@hrm.local",
      employeeId: "employee-manager",
      roles: ["MANAGER"],
      permissions: [
        "employees.read",
        "attendance.read",
        "attendance.write",
        "leave.read",
        "leave.write",
        "notifications.read",
        "notifications.write",
        "manager.read",
        "payroll.read",
      ],
      password: "Manager@123456",
    },
    {
      id: "user-employee-1",
      email: "ngoc.tran@hrm.local",
      employeeId: "employee-1",
      roles: ["EMPLOYEE"],
      permissions: [
        "employees.read",
        "attendance.read",
        "attendance.write",
        "leave.read",
        "leave.write",
        "notifications.read",
        "notifications.write",
        "payroll.read",
      ],
      password: "Employee@123456",
    },
    {
      id: "user-employee-2",
      email: "minh.le@hrm.local",
      employeeId: "employee-2",
      roles: ["EMPLOYEE"],
      permissions: [
        "employees.read",
        "attendance.read",
        "attendance.write",
        "leave.read",
        "leave.write",
        "notifications.read",
        "notifications.write",
        "payroll.read",
      ],
      password: "Employee@123456",
    },
  ];

  const engineeringDepartment = { id: "dept-eng", name: "Engineering", code: "ENG" };
  const hrDepartment = { id: "dept-hr", name: "Human Resources", code: "HR" };
  const softwareEngineer = {
    id: "pos-se",
    name: "Software Engineer",
    code: "SOFTWARE_ENGINEER",
  };
  const engineeringManager = {
    id: "pos-em",
    name: "Engineering Manager",
    code: "ENG_MANAGER",
  };

  const employees: EmployeeProfile[] = [
    {
      id: "employee-admin",
      employeeCode: "ADMIN001",
      companyEmail: "admin@hrm.local",
      fullName: "System Admin",
      employmentStatus: "ACTIVE",
      startDate: asIso("2026-01-01"),
      currentDepartment: hrDepartment,
      currentPosition: { id: "pos-hrm", name: "HR Manager", code: "HR_MANAGER" },
      contracts: [
        {
          id: "contract-admin",
          contractNumber: "CTR-ADMIN-2026",
          contractType: "INDEFINITE",
          baseSalary: "35000000",
          salaryBasisAmount: "35000000",
          startDate: asIso("2026-01-01"),
          isPrimary: true,
          isActive: true,
        },
      ],
    },
    {
      id: "employee-manager",
      employeeCode: "MGR001",
      companyEmail: "manager@hrm.local",
      fullName: "Hoang Pham",
      employmentStatus: "ACTIVE",
      startDate: asIso("2025-08-01"),
      currentDepartment: engineeringDepartment,
      currentPosition: engineeringManager,
      contracts: [
        {
          id: "contract-manager",
          contractNumber: "CTR-MGR-2025",
          contractType: "INDEFINITE",
          baseSalary: "42000000",
          salaryBasisAmount: "42000000",
          startDate: asIso("2025-08-01"),
          isPrimary: true,
          isActive: true,
        },
      ],
    },
    {
      id: "employee-1",
      employeeCode: "EMP001",
      companyEmail: "ngoc.tran@hrm.local",
      fullName: "Ngoc Tran",
      employmentStatus: "ACTIVE",
      startDate: asIso("2026-01-06"),
      currentDepartment: engineeringDepartment,
      currentPosition: softwareEngineer,
      manager: {
        id: "employee-manager",
        fullName: "Hoang Pham",
        companyEmail: "manager@hrm.local",
      },
      contracts: [
        {
          id: "contract-emp1",
          contractNumber: "CTR-EMP001-2026",
          contractType: "INDEFINITE",
          baseSalary: "22000000",
          salaryBasisAmount: "22000000",
          startDate: asIso("2026-01-06"),
          isPrimary: true,
          isActive: true,
        },
      ],
    },
    {
      id: "employee-2",
      employeeCode: "EMP002",
      companyEmail: "minh.le@hrm.local",
      fullName: "Minh Le",
      employmentStatus: "PROBATION",
      startDate: asIso("2026-02-10"),
      currentDepartment: engineeringDepartment,
      currentPosition: softwareEngineer,
      manager: {
        id: "employee-manager",
        fullName: "Hoang Pham",
        companyEmail: "manager@hrm.local",
      },
      contracts: [
        {
          id: "contract-emp2",
          contractNumber: "CTR-EMP002-2026",
          contractType: "INDEFINITE",
          baseSalary: "18000000",
          salaryBasisAmount: "18000000",
          startDate: asIso("2026-02-10"),
          isPrimary: true,
          isActive: true,
        },
      ],
    },
  ];

  const annualLeaveType = { id: "leave-annual", code: "ANNUAL_LEAVE", name: "Annual Leave" };

  return {
    users,
    employees,
    attendanceRecords: [
      {
        id: "attendance-1",
        workDate: asIso("2026-03-02"),
        attendanceStatus: "LATE",
        workedMinutes: 418,
        lateMinutes: 2,
        earlyLeaveMinutes: 0,
        overtimeMinutes: 35,
        checkInAt: asIso("2026-03-02T02:07:00.000Z"),
        checkOutAt: asIso("2026-03-02T09:05:00.000Z"),
      },
      {
        id: "attendance-2",
        workDate: asIso("2026-03-03"),
        attendanceStatus: "PRESENT",
        workedMinutes: 465,
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        overtimeMinutes: 75,
        checkInAt: asIso("2026-03-03T02:00:00.000Z"),
        checkOutAt: asIso("2026-03-03T09:45:00.000Z"),
      },
      {
        id: "attendance-3",
        workDate: asIso("2026-03-02"),
        attendanceStatus: "EARLY_LEAVE",
        workedMinutes: 411,
        lateMinutes: 0,
        earlyLeaveMinutes: 5,
        overtimeMinutes: 0,
        checkInAt: asIso("2026-03-02T01:59:00.000Z"),
        checkOutAt: asIso("2026-03-02T08:50:00.000Z"),
      },
      {
        id: "attendance-4",
        workDate: asIso("2026-03-04"),
        attendanceStatus: "PRESENT",
        workedMinutes: 466,
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        overtimeMinutes: 80,
        checkInAt: asIso("2026-03-04T02:04:00.000Z"),
        checkOutAt: asIso("2026-03-04T09:50:00.000Z"),
      },
    ].map((record, index) => ({
      ...record,
      employeeId: index < 2 ? "employee-1" : "employee-2",
    })) as AttendanceRecord[],
    overtimeRequests: [
      {
        id: "ot-1",
        workDate: asIso("2026-03-03"),
        totalMinutes: 90,
        overtimeDayType: "WEEKDAY",
        multiplier: "1.5",
        status: "PENDING",
        requestedNote: "Sprint release support",
        employee: { id: "employee-1", fullName: "Ngoc Tran", employeeCode: "EMP001" },
      },
      {
        id: "ot-2",
        workDate: asIso("2026-03-04"),
        totalMinutes: 80,
        approvedMinutes: 80,
        overtimeDayType: "WEEKDAY",
        multiplier: "1.5",
        status: "APPROVED",
        requestedNote: "Bugfix deployment support",
        decisionNote: "Approved for release support",
        employee: { id: "employee-2", fullName: "Minh Le", employeeCode: "EMP002" },
      },
    ],
    leaveBalances: [
      {
        id: "balance-1",
        year: 2026,
        openingBalance: "12",
        accruedBalance: "3",
        usedBalance: "1",
        adjustedBalance: "0",
        leaveType: annualLeaveType,
        employeeId: "employee-1",
      },
      {
        id: "balance-2",
        year: 2026,
        openingBalance: "12",
        accruedBalance: "2",
        usedBalance: "0.5",
        adjustedBalance: "0",
        leaveType: annualLeaveType,
        employeeId: "employee-2",
      },
    ] as Array<LeaveBalance & { employeeId: string }>,
    leaveRequests: [
      {
        id: "leave-1",
        fromDate: asIso("2026-03-20"),
        toDate: asIso("2026-03-21"),
        requestedDays: "2",
        reason: "Family event",
        status: "PENDING",
        submittedAt: asIso("2026-03-10T01:30:00.000Z"),
        leaveType: annualLeaveType,
        employee: { id: "employee-1", fullName: "Ngoc Tran", employeeCode: "EMP001" },
      },
      {
        id: "leave-2",
        fromDate: asIso("2026-03-25"),
        toDate: asIso("2026-03-25"),
        requestedDays: "1",
        reason: "Medical appointment",
        status: "APPROVED",
        submittedAt: asIso("2026-03-12T02:00:00.000Z"),
        decisionNote: "Approved by manager",
        leaveType: annualLeaveType,
        employee: { id: "employee-2", fullName: "Minh Le", employeeCode: "EMP002" },
      },
    ].map((request) => ({
      ...request,
      employeeId: request.employee?.id ?? "",
    })) as Array<LeaveRequest & { employeeId: string }>,
    payslips: [
      {
        id: "payslip-1",
        baseSalary: "22000000",
        grossIncome: "22765000",
        netIncome: "20035000",
        status: "PUBLISHED",
        publishedAt: asIso("2026-03-31T11:00:00.000Z"),
        payrollPeriod: {
          id: "period-2026-03",
          year: 2026,
          month: 3,
          status: "PUBLISHED",
          periodStart: asIso("2026-03-01"),
          periodEnd: asIso("2026-03-31"),
        },
        items: [
          { id: "pi-1", code: "BASE", label: "Base Salary", itemType: "BASE_SALARY", amount: "22000000" },
          { id: "pi-2", code: "OT", label: "Overtime Pay", itemType: "OVERTIME", amount: "765000" },
        ],
        employeeId: "employee-1",
      },
    ] as Array<Payslip & { employeeId: string }>,
    notifications: [
      {
        id: "notification-1",
        type: "LEAVE_SUBMITTED",
        title: "Leave request submitted",
        body: "Ngoc Tran submitted a leave request for approval",
        status: "UNREAD",
        createdAt: asIso("2026-03-10T02:00:00.000Z"),
        userId: "user-manager",
      },
      {
        id: "notification-2",
        type: "PAYSLIP_PUBLISHED",
        title: "Payslip published",
        body: "Your payslip for 03/2026 is ready",
        status: "UNREAD",
        createdAt: asIso("2026-03-31T11:10:00.000Z"),
        userId: "user-employee-1",
      },
    ] as Array<NotificationItem & { userId: string }>,
  };
}

function readState() {
  const raw = localStorage.getItem(MOCK_STATE_KEY);
  if (!raw) {
    const initial = createInitialState();
    writeState(initial);
    return initial;
  }
  return JSON.parse(raw) as MockState;
}

function writeState(state: MockState) {
  localStorage.setItem(MOCK_STATE_KEY, JSON.stringify(state));
}

function readExtraDepartments(): DepartmentListItem[] {
  const raw = localStorage.getItem(MOCK_DEPARTMENTS_KEY);
  return raw ? (JSON.parse(raw) as DepartmentListItem[]) : [];
}

function writeExtraDepartments(departments: DepartmentListItem[]) {
  localStorage.setItem(MOCK_DEPARTMENTS_KEY, JSON.stringify(departments));
}

function readExtraPositions(): Position[] {
  const raw = localStorage.getItem(MOCK_POSITIONS_KEY);
  return raw ? (JSON.parse(raw) as Position[]) : [];
}

function writeExtraPositions(positions: Position[]) {
  localStorage.setItem(MOCK_POSITIONS_KEY, JSON.stringify(positions));
}

function getCurrentUser(state: MockState) {
  const token = getAccessToken();
  const userId = token?.replace("mock-access-", "");
  const user = state.users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

function getEmployee(state: MockState, employeeId: string) {
  return state.employees.find((employee) => employee.id === employeeId);
}

function getDepartmentList(state: MockState) {
  const map = new Map<string, DepartmentListItem>();

  for (const employee of state.employees) {
    const department = employee.currentDepartment;
    if (!department) continue;

    const current =
      map.get(department.id) ??
      ({
        ...department,
        branch: employee.branch
          ? {
              id: employee.branch.id,
              name: employee.branch.name,
            }
          : null,
        managerEmployee: employee.manager?.id === undefined ? null : employee.manager,
        isActive: true,
        currentEmployees: [],
        _count: { currentEmployees: 0 },
        summary: {
          employeeCount: 0,
          activeCount: 0,
          managerCount: 0,
          positions: 0,
        },
      } satisfies DepartmentListItem);

    current.currentEmployees.push(employee);
    current._count.currentEmployees += 1;
    current.summary.employeeCount += 1;
    if (["ACTIVE", "PROBATION"].includes(employee.employmentStatus)) {
      current.summary.activeCount += 1;
    }
    map.set(department.id, current);
  }

  const derivedDepartments = Array.from(map.values()).map((department) => ({
    ...department,
    managerEmployee:
      department.currentEmployees.find((employee) => !employee.manager)?.manager ?? null,
    summary: {
      ...department.summary,
      managerCount: department.currentEmployees.filter((employee) => !employee.manager).length,
      positions: Array.from(
        new Set(department.currentEmployees.map((employee) => employee.currentPosition?.name ?? "-")),
      ).length,
    },
  }));

  const merged = new Map<string, DepartmentListItem>();

  for (const department of [...readExtraDepartments(), ...derivedDepartments]) {
    const current = merged.get(department.id);
    merged.set(
      department.id,
      current
        ? {
            ...department,
            currentEmployees:
              department.currentEmployees.length > 0 ? department.currentEmployees : current.currentEmployees,
            _count:
              department._count.currentEmployees > 0 ? department._count : current._count,
            summary:
              department.summary.employeeCount > 0 ? department.summary : current.summary,
          }
        : department,
    );
  }

  return Array.from(merged.values());
}

function getDepartmentDetail(state: MockState, departmentId: string) {
  const department = getDepartmentList(state).find((item) => item.id === departmentId);
  if (!department) {
    return null;
  }

  return {
    ...department,
    summary: {
      employeeCount: department.currentEmployees.length,
      activeCount: department.currentEmployees.filter((employee) =>
        ["ACTIVE", "PROBATION"].includes(employee.employmentStatus),
      ).length,
      statusSummary: department.currentEmployees.reduce<Record<string, number>>((acc, employee) => {
        acc[employee.employmentStatus] = (acc[employee.employmentStatus] ?? 0) + 1;
        return acc;
      }, {}),
      positionSummary: department.currentEmployees.reduce<Record<string, number>>((acc, employee) => {
        const key = employee.currentPosition?.name ?? "Unassigned";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    },
  } satisfies DepartmentDetail;
}

function getPositionList(state: MockState): Position[] {
  const company = state.employees[0]?.company ?? {
    id: "company-mock",
    name: "HRM Company",
    code: "HRM",
  };

  const map = new Map<string, Position>();

  for (const employee of state.employees) {
    const position = employee.currentPosition;
    if (!position) continue;

    const current = map.get(position.id) ?? {
      ...position,
      company,
      level: position.level ?? 1,
      isActive: position.isActive ?? true,
      _count: { currentEmployees: 0 },
    };

    current._count = {
      currentEmployees: (current._count?.currentEmployees ?? 0) + 1,
    };

    map.set(position.id, current);
  }

  const merged = new Map<string, Position>();

  for (const position of [...readExtraPositions(), ...Array.from(map.values())]) {
    const current = merged.get(position.id);
    merged.set(
      position.id,
      current
        ? {
            ...position,
            _count:
              (position._count?.currentEmployees ?? 0) > 0 ? position._count : current._count,
          }
        : position,
    );
  }

  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function getEmployeeRecords(state: MockState, employeeId: string) {
  return state.attendanceRecords
    .filter((record) => record.employeeId === employeeId)
    .sort((a, b) => b.workDate.localeCompare(a.workDate));
}

function getEmployeeOvertime(state: MockState, employeeId: string) {
  return state.overtimeRequests
    .filter((record) => record.employee?.id === employeeId)
    .sort((a, b) => b.workDate.localeCompare(a.workDate));
}

function getEmployeeLeaveRequests(state: MockState, employeeId: string) {
  return state.leaveRequests
    .filter((request) => request.employeeId === employeeId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

function getEmployeeBalances(state: MockState, employeeId: string) {
  return state.leaveBalances
    .filter((balance) => balance.employeeId === employeeId)
    .sort((a, b) => b.year - a.year);
}

function getAttendanceSummary(records: AttendanceRecord[]): AttendanceMonthlySummary {
  return {
    year: mockYear,
    month: mockMonth,
    totalDays: records.length,
    presentDays: records.filter((item) =>
      ["PRESENT", "LATE", "EARLY_LEAVE"].includes(item.attendanceStatus),
    ).length,
    absentDays: records.filter((item) => item.attendanceStatus === "ABSENT").length,
    lateCount: records.filter((item) => item.lateMinutes > 0).length,
    totalWorkedMinutes: records.reduce((sum, item) => sum + item.workedMinutes, 0),
    totalOvertimeMinutes: records.reduce((sum, item) => sum + item.overtimeMinutes, 0),
  };
}

function createAuthResponse(user: MockState["users"][number]): AuthResponse {
  return {
    accessToken: `mock-access-${user.id}`,
    refreshToken: `mock-refresh-${user.id}`,
    user: {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      roles: user.roles,
      permissions: user.permissions,
    },
  };
}

export async function mockRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  payload?: unknown,
  params?: Record<string, unknown>,
): Promise<T> {
  const state = readState();

  if (method === "POST" && path === "/auth/login") {
    const body = payload as { email: string; password: string };
    const user = state.users.find(
      (item) => item.email === body.email && item.password === body.password,
    );
    if (!user) {
      throw new Error("Invalid credentials");
    }
    return clone(createAuthResponse(user)) as T;
  }

  if (method === "POST" && path === "/auth/refresh") {
    const refreshToken = (payload as { refreshToken: string }).refreshToken;
    const userId = refreshToken.replace("mock-refresh-", "");
    const user = state.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error("Invalid refresh token");
    }
    return clone(createAuthResponse(user)) as T;
  }

  const currentUser = getCurrentUser(state);
  const currentEmployee = currentUser.employeeId
    ? getEmployee(state, currentUser.employeeId)
    : null;

  if (method === "GET" && path === "/auth/me") {
    return clone(createAuthResponse(currentUser).user) as T;
  }

  if (method === "GET" && path === "/employees/me") {
    return clone(currentEmployee) as T;
  }

  if (method === "GET" && path === "/employees") {
    const page = Number(params?.page ?? 1);
    const limit = Number(params?.limit ?? 20);
    const keyword = String(params?.search ?? "").trim().toLowerCase();
    const items = state.employees.filter((employee) => {
      if (!keyword) {
        return true;
      }

      return [
        employee.fullName,
        employee.employeeCode,
        employee.companyEmail,
        employee.currentDepartment?.name ?? "",
        employee.currentPosition?.name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });

    return clone({
      items: items.slice((page - 1) * limit, page * limit),
      total: items.length,
      page,
      limit,
    } satisfies EmployeeListResponse) as T;
  }

  if (method === "POST" && path === "/employees") {
    const body = payload as {
      companyId: string;
      branchId: string;
      employeeCode: string;
      companyEmail: string;
      firstName: string;
      lastName: string;
      currentDepartmentId: string;
      currentPositionId: string;
      currentManagerEmployeeId?: string;
      startDate: string;
      gender?: string;
    };

    const department = getDepartmentList(state).find((item) => item.id === body.currentDepartmentId);
    const position = getPositionList(state).find((item) => item.id === body.currentPositionId);
    const manager = body.currentManagerEmployeeId
      ? getEmployee(state, body.currentManagerEmployeeId)
      : null;

    const nextEmployee: EmployeeProfile = {
      id: `employee-${Date.now()}`,
      employeeCode: body.employeeCode,
      companyEmail: body.companyEmail,
      firstName: body.firstName,
      lastName: body.lastName,
      fullName: `${body.firstName} ${body.lastName}`.trim(),
      gender: body.gender ?? "UNDISCLOSED",
      employmentStatus: "ACTIVE",
      startDate: asIso(body.startDate),
      company: {
        id: body.companyId,
        name: state.employees[0]?.company?.name ?? "HRM Company",
        code: state.employees[0]?.company?.code ?? "HRM",
      },
      branch: department?.branch
        ? {
            id: department.branch.id,
            name: department.branch.name,
            code: "HN",
            city: "Hanoi",
            address: "Hanoi Office",
          }
        : null,
      currentDepartment: department
        ? {
            id: department.id,
            name: department.name,
            code: department.code,
          }
        : null,
      currentPosition: position
        ? {
            id: position.id,
            name: position.name,
            code: position.code,
            level: position.level,
            isActive: position.isActive,
          }
        : null,
      manager: manager
        ? {
            id: manager.id,
            employeeCode: manager.employeeCode,
            fullName: manager.fullName,
            companyEmail: manager.companyEmail,
            currentPosition: manager.currentPosition ?? null,
          }
        : null,
      contracts: [],
      leaveBalances: [],
      attendanceRecords: [],
      leaveRequests: [],
      overtimeRequests: [],
      orgHistories: [],
      user: null,
    };

    state.employees.unshift(nextEmployee);
    writeState(state);
    return clone(nextEmployee) as T;
  }

  if (method === "GET" && path.startsWith("/employees/")) {
    const employeeId = path.replace("/employees/", "");
    const employee = getEmployee(state, employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    return clone({
      ...employee,
      company: {
        id: "company-1",
        name: "HRM Company",
        code: "HRM",
      },
      branch: {
        id: "branch-hn",
        name: "Ha Noi",
        code: "HN",
        city: "Ha Noi",
        address: "Dong Da, Ha Noi",
      },
      personalEmail: employee.companyEmail.replace("@hrm.local", "@gmail.com"),
      firstName: employee.fullName.split(" ").slice(0, -1).join(" ") || employee.fullName,
      lastName: employee.fullName.split(" ").slice(-1).join(""),
      gender: "UNDISCLOSED",
      birthDate: asIso("1998-08-10"),
      phoneNumber: "0987-654-321",
      nationalId: "001098765432",
      address: "Ha Noi, Viet Nam",
      emergencyContactName: "Emergency Contact",
      emergencyContactPhone: "0901-222-333",
      bankAccountName: employee.fullName,
      bankAccountNumber: "1234567890",
      defaultShift: {
        id: "shift-default",
        code: "SHIFT_HC",
        name: "Office hours",
        startMinute: 540,
        endMinute: 1080,
        lateThresholdMinute: 5,
        earlyLeaveThresholdMinute: 5,
        overtimeStartMinute: 1110,
      },
      leaveBalances: getEmployeeBalances(state, employee.id),
      attendanceRecords: getEmployeeRecords(state, employee.id).slice(0, 8),
      leaveRequests: getEmployeeLeaveRequests(state, employee.id).slice(0, 8),
      overtimeRequests: getEmployeeOvertime(state, employee.id).slice(0, 8),
      orgHistories: [
        {
          id: `org-history-${employee.id}`,
          effectiveFrom: employee.startDate,
          effectiveTo: null,
          note: "Joined current department and position",
          department: employee.currentDepartment,
          position: employee.currentPosition,
          managerEmployee: employee.manager ?? null,
        },
      ],
      user: {
        id: state.users.find((user) => user.employeeId === employee.id)?.id ?? `user-${employee.id}`,
        email: employee.companyEmail,
        status: "ACTIVE",
        roles: (state.users.find((user) => user.employeeId === employee.id)?.roles ?? []).map((role, index) => ({
          id: `${employee.id}-role-${index}`,
          role: {
            id: role,
            code: role,
            name: role,
          },
        })),
      },
    }) as T;
  }

  if (method === "GET" && path === "/departments") {
    return clone(getDepartmentList(state)) as T;
  }

  if (method === "POST" && path === "/departments") {
    const body = payload as {
      branchId: string;
      name: string;
      code?: string;
      managerEmployeeId?: string | null;
    };

    const branchTemplate = getDepartmentList(state).find((item) => item.branch?.id === body.branchId)?.branch;
    const manager = body.managerEmployeeId ? getEmployee(state, body.managerEmployeeId) : null;

    const department: DepartmentListItem = {
      id: `dept-${Date.now()}`,
      name: body.name,
      code: body.code ?? null,
      branch: branchTemplate
        ? {
            id: branchTemplate.id,
            name: branchTemplate.name,
          }
        : {
            id: body.branchId,
            name: "Hanoi Branch",
          },
      managerEmployee: manager
        ? {
            id: manager.id,
            fullName: manager.fullName,
            companyEmail: manager.companyEmail,
          }
        : null,
      isActive: true,
      currentEmployees: [],
      _count: {
        currentEmployees: 0,
      },
      summary: {
        employeeCount: 0,
        activeCount: 0,
        managerCount: manager ? 1 : 0,
        positions: 0,
      },
    };

    writeExtraDepartments([department, ...readExtraDepartments()]);
    return clone(getDepartmentDetail(state, department.id)) as T;
  }

  if (method === "GET" && path.startsWith("/departments/")) {
    const departmentId = path.replace("/departments/", "");
    const department = getDepartmentDetail(state, departmentId);
    if (!department) {
      throw new Error("Department not found");
    }
    return clone(department) as T;
  }

  if (method === "PATCH" && path.startsWith("/employees/") && !path.includes("/contracts/")) {
    const employeeId = path.replace("/employees/", "");
    const employeeIndex = state.employees.findIndex((employee) => employee.id === employeeId);
    if (employeeIndex === -1) {
      throw new Error("Employee not found");
    }

    const body = payload as Record<string, string | null | undefined>;
    const current = state.employees[employeeIndex];
    state.employees[employeeIndex] = {
      ...current,
      companyEmail: body.companyEmail ?? current.companyEmail,
      personalEmail: body.personalEmail ?? current.personalEmail,
      phoneNumber: body.phoneNumber ?? current.phoneNumber,
      address: body.address ?? current.address,
      emergencyContactName: body.emergencyContactName ?? current.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone ?? current.emergencyContactPhone,
      bankAccountName: body.bankAccountName ?? current.bankAccountName,
      bankAccountNumber: body.bankAccountNumber ?? current.bankAccountNumber,
      employmentStatus: body.employmentStatus ?? current.employmentStatus,
      startDate: body.startDate ? asIso(body.startDate) : current.startDate,
      endDate: body.endDate ? asIso(body.endDate) : null,
    };

    writeState(state);
    return clone(await mockRequest<T>("GET", `/employees/${employeeId}`)) as T;
  }

  if (method === "POST" && path.includes("/contracts")) {
    const [, , employeeId] = path.split("/");
    const employeeIndex = state.employees.findIndex((employee) => employee.id === employeeId);
    if (employeeIndex === -1) {
      throw new Error("Employee not found");
    }

    const body = payload as Record<string, string>;
    const employee = state.employees[employeeIndex];
    const nextContract = {
      id: `contract-${Date.now()}`,
      contractType: body.contractType,
      contractNumber: body.contractNumber,
      startDate: asIso(body.startDate),
      endDate: body.endDate ? asIso(body.endDate) : null,
      baseSalary: body.baseSalary,
      salaryBasisAmount: body.salaryBasisAmount || null,
      salaryCurrency: body.salaryCurrency || "VND",
      isPrimary: true,
      isActive: true,
    };

    state.employees[employeeIndex] = {
      ...employee,
      contracts: [nextContract, ...(employee.contracts ?? [])],
    };

    writeState(state);
    return clone(await mockRequest<T>("GET", `/employees/${employeeId}`)) as T;
  }

  if (method === "PATCH" && path.includes("/contracts/")) {
    const [, , employeeId, , contractId] = path.split("/");
    const employeeIndex = state.employees.findIndex((employee) => employee.id === employeeId);
    if (employeeIndex === -1) {
      throw new Error("Employee not found");
    }

    const body = payload as Record<string, string>;
    const employee = state.employees[employeeIndex];
    state.employees[employeeIndex] = {
      ...employee,
      contracts: (employee.contracts ?? []).map((contract) =>
        contract.id === contractId
          ? {
              ...contract,
              contractType: body.contractType ?? contract.contractType,
              contractNumber: body.contractNumber ?? contract.contractNumber,
              startDate: body.startDate ? asIso(body.startDate) : contract.startDate,
              endDate: body.endDate ? asIso(body.endDate) : null,
              baseSalary: body.baseSalary ?? contract.baseSalary,
              salaryBasisAmount: body.salaryBasisAmount ?? contract.salaryBasisAmount,
              salaryCurrency: body.salaryCurrency ?? contract.salaryCurrency,
            }
          : contract,
      ),
    };

    writeState(state);
    return clone(await mockRequest<T>("GET", `/employees/${employeeId}`)) as T;
  }

  if (method === "PATCH" && path.startsWith("/departments/")) {
    const departmentId = path.replace("/departments/", "");
    const body = payload as Record<string, string | boolean | null | undefined>;
    const manager = typeof body.managerEmployeeId === "string"
      ? getEmployee(state, body.managerEmployeeId) ?? null
      : null;

    const extraDepartments = readExtraDepartments();
    if (extraDepartments.some((department) => department.id === departmentId)) {
      const updatedDepartment = extraDepartments.map((department) =>
        department.id === departmentId
          ? {
              ...department,
              name: typeof body.name === "string" ? body.name : department.name,
              code: typeof body.code === "string" ? body.code : department.code,
              managerEmployee: manager
                ? {
                    id: manager.id,
                    fullName: manager.fullName,
                    companyEmail: manager.companyEmail,
                  }
                : null,
            }
          : department,
      );
      writeExtraDepartments(updatedDepartment);
      return clone(getDepartmentDetail(state, departmentId)) as T;
    }

    state.employees = state.employees.map((employee) =>
      employee.currentDepartment?.id === departmentId
        ? {
            ...employee,
            currentDepartment: employee.currentDepartment
              ? {
                  ...employee.currentDepartment,
                  name: typeof body.name === "string" ? body.name : employee.currentDepartment.name,
                  code: typeof body.code === "string" ? body.code : employee.currentDepartment.code,
                  managerEmployee: manager
                    ? {
                        id: manager.id,
                        fullName: manager.fullName,
                        companyEmail: manager.companyEmail,
                      }
                    : employee.currentDepartment.managerEmployee,
                }
              : employee.currentDepartment,
          }
        : employee,
    );

    writeState(state);
    return clone(getDepartmentDetail(state, departmentId)) as T;
  }

  if (method === "GET" && path === "/positions") {
    return clone(getPositionList(state)) as T;
  }

  if (method === "POST" && path === "/positions") {
    const body = payload as {
      companyId: string;
      name: string;
      code?: string;
      level?: number;
      isActive?: boolean;
    };

    const nextPosition: Position = {
      id: `pos-${Date.now()}`,
      name: body.name,
      code: body.code ?? null,
      level: body.level ?? 1,
      isActive: body.isActive ?? true,
      company: {
        id: body.companyId,
        name: state.employees[0]?.company?.name ?? "HRM Company",
        code: state.employees[0]?.company?.code ?? "HRM",
      },
      _count: {
        currentEmployees: 0,
      },
    };

    writeExtraPositions([nextPosition, ...readExtraPositions()]);
    return clone(nextPosition) as T;
  }

  if (method === "PATCH" && path.startsWith("/positions/")) {
    const positionId = path.replace("/positions/", "");
    const body = payload as {
      companyId?: string;
      name?: string;
      code?: string;
      level?: number;
      isActive?: boolean;
    };

    const current = getPositionList(state).find((item) => item.id === positionId);
    if (!current) {
      throw new Error("Position not found");
    }

    const updated: Position = {
      ...current,
      company: body.companyId
        ? {
            id: body.companyId,
            name: current.company?.name ?? "HRM Company",
            code: current.company?.code ?? "HRM",
          }
        : current.company,
      name: body.name ?? current.name,
      code: body.code ?? current.code,
      level: body.level ?? current.level,
      isActive: body.isActive ?? current.isActive,
    };

    state.employees = state.employees.map((employee) =>
      employee.currentPosition?.id === positionId
        ? {
            ...employee,
            currentPosition: {
              id: updated.id,
              name: updated.name,
              code: updated.code,
              level: updated.level,
              isActive: updated.isActive,
            },
          }
        : employee,
    );

    const extraPositions = readExtraPositions();
    if (extraPositions.some((position) => position.id === positionId)) {
      writeExtraPositions(
        extraPositions.map((position) => (position.id === positionId ? updated : position)),
      );
    } else {
      writeState(state);
    }
    return clone(updated) as T;
  }

  if (method === "GET" && path === "/attendance/me") {
    return clone({
      records: getEmployeeRecords(state, currentUser.employeeId ?? ""),
      overtimeRequests: getEmployeeOvertime(state, currentUser.employeeId ?? ""),
    } satisfies AttendanceDashboard) as T;
  }

  if (method === "GET" && path === "/attendance/me/monthly-summary") {
    return clone(
      getAttendanceSummary(getEmployeeRecords(state, currentUser.employeeId ?? "")),
    ) as T;
  }

  if (method === "POST" && path === "/attendance/me/check-in") {
    const records = getEmployeeRecords(state, currentUser.employeeId ?? "");
    const workDate = asIso("2026-03-16");
    const existing = records.find((record) => record.workDate.startsWith("2026-03-16"));
    if (existing?.checkInAt) {
      throw new Error("Already checked in today");
    }
    const record: AttendanceRecord = {
      id: `attendance-${Date.now()}`,
      employeeId: currentUser.employeeId ?? "",
      workDate,
      attendanceStatus: "PRESENT",
      workedMinutes: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      checkInAt: new Date().toISOString(),
      checkOutAt: null,
    } as AttendanceRecord & { employeeId: string };
    state.attendanceRecords = [
      record as AttendanceRecord & { employeeId: string },
      ...state.attendanceRecords.filter((item) => item.id !== record.id),
    ];
    writeState(state);
    return clone(record) as T;
  }

  if (method === "POST" && path === "/attendance/me/check-out") {
    const index = state.attendanceRecords.findIndex(
      (record) =>
        record.employeeId === currentUser.employeeId &&
        record.workDate.startsWith("2026-03-16"),
    );
    if (index === -1) {
      throw new Error("No check-in found for today");
    }
    const updated = {
      ...state.attendanceRecords[index],
      checkOutAt: new Date().toISOString(),
      workedMinutes: 515,
      overtimeMinutes: 45,
      attendanceStatus: "PRESENT",
    };
    state.attendanceRecords[index] = updated;
    writeState(state);
    return clone(updated) as T;
  }

  if (method === "POST" && path === "/attendance/overtime-requests") {
    const body = payload as {
      employeeId: string;
      workDate: string;
      totalMinutes: number;
      overtimeDayType: string;
      requestedNote?: string;
    };
    const employee = getEmployee(state, body.employeeId);
    const overtime: OvertimeRequest = {
      id: `ot-${Date.now()}`,
      workDate: asIso(body.workDate),
      totalMinutes: body.totalMinutes,
      overtimeDayType: body.overtimeDayType,
      multiplier:
        body.overtimeDayType === "WEEKDAY"
          ? "1.5"
          : body.overtimeDayType === "WEEKEND"
            ? "2"
            : "3",
      status: "PENDING",
      requestedNote: body.requestedNote,
      employee: employee
        ? {
            id: employee.id,
            fullName: employee.fullName,
            employeeCode: employee.employeeCode,
          }
        : undefined,
    };
    state.overtimeRequests.unshift(overtime);
    writeState(state);
    return clone(overtime) as T;
  }

  if (method === "GET" && path === "/leave/me") {
    return clone({
      balances: getEmployeeBalances(state, currentUser.employeeId ?? ""),
      requests: getEmployeeLeaveRequests(state, currentUser.employeeId ?? ""),
    } satisfies LeaveDashboard) as T;
  }

  if (method === "POST" && path === "/leave/requests") {
    const body = payload as {
      employeeId: string;
      leaveTypeId: string;
      fromDate: string;
      toDate: string;
      requestedDays: number;
      reason: string;
    };
    const employee = getEmployee(state, body.employeeId);
    const balance = getEmployeeBalances(state, body.employeeId)[0];
    const request: LeaveRequest & { employeeId: string } = {
      id: `leave-${Date.now()}`,
      employeeId: body.employeeId,
      fromDate: asIso(body.fromDate),
      toDate: asIso(body.toDate),
      requestedDays: String(body.requestedDays),
      reason: body.reason,
      status: "PENDING",
      submittedAt: new Date().toISOString(),
      leaveType: balance?.leaveType ?? {
        id: body.leaveTypeId,
        code: "ANNUAL_LEAVE",
        name: "Annual Leave",
      },
      employee: employee
        ? {
            id: employee.id,
            fullName: employee.fullName,
            employeeCode: employee.employeeCode,
          }
        : undefined,
    };
    state.leaveRequests.unshift(request);
    const managerUser = state.users.find((item) => item.employeeId === employee?.manager?.id);
    if (managerUser && employee) {
      state.notifications.unshift({
        id: `notification-${Date.now()}`,
        type: "LEAVE_SUBMITTED",
        title: "Leave request submitted",
        body: `${employee.fullName} submitted a leave request for approval`,
        status: "UNREAD",
        createdAt: new Date().toISOString(),
        userId: managerUser.id,
      } as NotificationItem & { userId: string });
    }
    writeState(state);
    return clone(request) as T;
  }

  if (method === "PATCH" && path.startsWith("/leave/requests/") && path.endsWith("/cancel")) {
    const requestId = path.split("/")[3];
    const body = (payload as { note?: string } | undefined) ?? {};
    const request = state.leaveRequests.find((item) => item.id === requestId);
    if (!request) {
      throw new Error("Leave request not found");
    }
    request.status = "CANCELLED";
    request.decisionNote = body.note;
    writeState(state);
    return clone(request) as T;
  }

  if (method === "PATCH" && path.startsWith("/leave/requests/") && path.endsWith("/decision")) {
    const requestId = path.split("/")[3];
    const body = payload as { status: "APPROVED" | "REJECTED"; note?: string };
    const request = state.leaveRequests.find((item) => item.id === requestId);
    if (!request) {
      throw new Error("Leave request not found");
    }
    request.status = body.status;
    request.decisionNote = body.note;
    writeState(state);
    return clone(request) as T;
  }

  if (method === "GET" && path === "/payroll/me") {
    return clone(
      state.payslips
        .filter((item) => item.employeeId === currentUser.employeeId)
        .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")),
    ) as T;
  }

  if (method === "GET" && path === "/notifications/me") {
    const page = Number(params?.page ?? 1);
    const limit = Number(params?.limit ?? 20);
    const items = state.notifications
      .filter((item) => item.userId === currentUser.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return clone({
      items: items.slice((page - 1) * limit, page * limit),
      total: items.length,
      page,
      limit,
    } satisfies NotificationList) as T;
  }

  if (method === "GET" && path === "/notifications/me/unread-count") {
    return clone({
      unreadCount: state.notifications.filter(
        (item) => item.userId === currentUser.id && item.status === "UNREAD",
      ).length,
    } satisfies UnreadCount) as T;
  }

  if (method === "PATCH" && path.startsWith("/notifications/me/") && path.endsWith("/read")) {
    const id = path.split("/")[3];
    const notification = state.notifications.find(
      (item) => item.id === id && item.userId === currentUser.id,
    );
    if (!notification) throw new Error("Notification not found");
    notification.status = "READ";
    notification.readAt = new Date().toISOString();
    writeState(state);
    return clone(notification) as T;
  }

  if (method === "PATCH" && path === "/notifications/me/read-all") {
    let updatedCount = 0;
    state.notifications = state.notifications.map((item) => {
      if (item.userId === currentUser.id && item.status === "UNREAD") {
        updatedCount += 1;
        return {
          ...item,
          status: "READ",
          readAt: new Date().toISOString(),
        };
      }
      return item;
    });
    writeState(state);
    return clone({ updatedCount }) as T;
  }

  if (method === "GET" && path === "/manager/team") {
    return clone(
      state.employees.filter((employee) => employee.manager?.id === currentUser.employeeId),
    ) as T;
  }

  if (method === "GET" && path === "/manager/team/attendance") {
    const teamEmployees = state.employees.filter(
      (employee) => employee.manager?.id === currentUser.employeeId,
    );
    const items = teamEmployees.map((employee) => {
      const records = getEmployeeRecords(state, employee.id);
      return {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        totalWorkedMinutes: records.reduce((sum, item) => sum + item.workedMinutes, 0),
        totalOvertimeMinutes: records.reduce((sum, item) => sum + item.overtimeMinutes, 0),
        lateCount: records.filter((item) => item.lateMinutes > 0).length,
        earlyLeaveCount: records.filter((item) => item.earlyLeaveMinutes > 0).length,
      };
    });
    return clone({
      teamSize: items.length,
      items,
    } satisfies TeamAttendanceSnapshot) as T;
  }

  if (method === "GET" && path === "/manager/team/approvals") {
    return clone({
      leaveRequests: state.leaveRequests.filter(
        (request) =>
          request.employee?.id &&
          state.employees.find((item) => item.id === request.employee?.id)?.manager?.id ===
            currentUser.employeeId &&
          request.status === "PENDING",
      ),
      overtimeRequests: state.overtimeRequests.filter(
        (request) =>
          request.employee?.id &&
          state.employees.find((item) => item.id === request.employee?.id)?.manager?.id ===
            currentUser.employeeId &&
          request.status === "PENDING",
      ),
    } satisfies TeamApprovalQueues) as T;
  }

  if (
    method === "PATCH" &&
    path.startsWith("/attendance/overtime-requests/") &&
    path.endsWith("/decision")
  ) {
    const requestId = path.split("/")[3];
    const body = payload as {
      status: "APPROVED" | "REJECTED";
      approvedMinutes?: number;
      note?: string;
    };
    const request = state.overtimeRequests.find((item) => item.id === requestId);
    if (!request) {
      throw new Error("Overtime request not found");
    }
    request.status = body.status;
    request.approvedMinutes =
      body.status === "APPROVED"
        ? (body.approvedMinutes ?? request.totalMinutes)
        : undefined;
    request.decisionNote = body.note;
    writeState(state);
    return clone(request) as T;
  }

  if (method === "GET" && path.startsWith("/manager/team/")) {
    const employeeId = path.split("/")[3];
    const employee = getEmployee(state, employeeId);
    if (!employee) throw new Error("Team member not found");
    return clone({
      profile: {
        ...employee,
        defaultShift: {
          id: "shift-default",
          code: "SHIFT_HC",
          name: "Default Office Shift",
          startMinute: 540,
          endMinute: 1080,
          lateThresholdMinute: 5,
          earlyLeaveThresholdMinute: 5,
          overtimeStartMinute: 1110,
        },
        leaveBalances: getEmployeeBalances(state, employeeId),
        leaveRequests: getEmployeeLeaveRequests(state, employeeId).slice(0, 5),
        overtimeRequests: getEmployeeOvertime(state, employeeId).slice(0, 5),
        attendanceRecords: getEmployeeRecords(state, employeeId).slice(0, 10),
      },
      summary: {
        recentAttendanceCount: getEmployeeRecords(state, employeeId).length,
        recentLateCount: getEmployeeRecords(state, employeeId).filter((item) => item.lateMinutes > 0).length,
        recentEarlyLeaveCount: getEmployeeRecords(state, employeeId).filter((item) => item.earlyLeaveMinutes > 0).length,
        recentOvertimeRequestCount: getEmployeeOvertime(state, employeeId).length,
        pendingLeaveRequestCount: getEmployeeLeaveRequests(state, employeeId).filter((item) => item.status === "PENDING").length,
      },
    } satisfies TeamMemberDetail) as T;
  }

  if (method === "GET" && path === "/reports/hr-summary") {
    const departmentsMap = new Map<string, HrSummary["departments"][number]>();
    for (const employee of state.employees) {
      if (!employee.currentDepartment) continue;
      const current = departmentsMap.get(employee.currentDepartment.id) ?? {
        id: employee.currentDepartment.id,
        name: employee.currentDepartment.name,
        employeeCount: 0,
      };
      current.employeeCount += 1;
      departmentsMap.set(employee.currentDepartment.id, current);
    }
    return clone({
      filters: {},
      totalEmployees: state.employees.length,
      activeEmployees: state.employees.filter((item) =>
        ["ACTIVE", "PROBATION"].includes(item.employmentStatus),
      ).length,
      departments: Array.from(departmentsMap.values()),
    } satisfies HrSummary) as T;
  }

  if (method === "GET" && path === "/reports/attendance-summary") {
    const records = state.attendanceRecords;
    return clone({
      filters: normalizeFilters(params),
      year: Number(params?.year ?? mockYear),
      month: Number(params?.month ?? mockMonth),
      totalRecords: records.length,
      presentCount: records.filter((item) => item.attendanceStatus === "PRESENT").length,
      lateCount: records.filter((item) => item.lateMinutes > 0).length,
      earlyLeaveCount: records.filter((item) => item.earlyLeaveMinutes > 0).length,
      absentCount: records.filter((item) => item.attendanceStatus === "ABSENT").length,
      totalWorkedMinutes: records.reduce((sum, item) => sum + item.workedMinutes, 0),
      totalOvertimeMinutes: records.reduce((sum, item) => sum + item.overtimeMinutes, 0),
    } satisfies AttendanceSummary) as T;
  }

  if (method === "GET" && path === "/reports/leave-summary") {
    const requests = state.leaveRequests;
    const byLeaveType = requests.reduce<LeaveSummary["byLeaveType"]>((acc, item) => {
      const existing = acc.find((entry) => entry.code === item.leaveType.code);
      if (existing) {
        existing.days += Number(item.requestedDays);
      } else {
        acc.push({
          code: item.leaveType.code,
          name: item.leaveType.name,
          days: Number(item.requestedDays),
        });
      }
      return acc;
    }, []);
    return clone({
      filters: normalizeFilters(params),
      year: Number(params?.year ?? mockYear),
      month: Number(params?.month ?? mockMonth),
      totalRequests: requests.length,
      approvedCount: requests.filter((item) => item.status === "APPROVED").length,
      pendingCount: requests.filter((item) => item.status === "PENDING").length,
      rejectedCount: requests.filter((item) => item.status === "REJECTED").length,
      byLeaveType,
    } satisfies LeaveSummary) as T;
  }

  if (method === "GET" && path === "/reports/payroll-summary") {
    const payslips = state.payslips;
    return clone({
      filters: normalizeFilters(params),
      year: Number(params?.year ?? mockYear),
      month: Number(params?.month ?? mockMonth),
      totalPeriods: 1,
      publishedPeriods: 1,
      totalPayslips: payslips.length,
      totalGrossIncome: payslips.reduce((sum, item) => sum + Number(item.grossIncome), 0),
      totalNetIncome: payslips.reduce((sum, item) => sum + Number(item.netIncome), 0),
      totalTaxDeduction: 600000,
      totalInsuranceDeduction: 4200000,
    } satisfies PayrollSummary) as T;
  }

  throw new Error(`Mock endpoint not implemented: ${method} ${path}`);
}

export async function mockDownload(path: string): Promise<Blob> {
  const rows =
    path === "/reports/attendance-summary/export.csv"
      ? "employee,workedMinutes,overtimeMinutes\nNgoc Tran,883,110\nMinh Le,877,80"
      : path === "/reports/leave-summary/export.csv"
        ? "employee,leaveType,status\nNgoc Tran,Annual Leave,PENDING\nMinh Le,Annual Leave,APPROVED"
        : path === "/reports/payroll-summary/export.csv"
          ? "employee,grossIncome,netIncome\nNgoc Tran,22765000,20035000"
          : "metric,value\ntotalEmployees,4\nactiveEmployees,4";

  return new Blob([rows], { type: "text/csv;charset=utf-8" });
}
