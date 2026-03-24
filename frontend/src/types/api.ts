export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  timestamp: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type RoleCode =
  | "ADMIN"
  | "HR_MANAGER"
  | "HR"
  | "PAYROLL"
  | "MANAGER"
  | "EMPLOYEE";

export type AuthUser = {
  id: string;
  email: string;
  employeeId: string | null;
  roles: RoleCode[];
  permissions: string[];
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type Department = {
  id: string;
  name: string;
  code?: string | null;
  branch?: {
    id: string;
    name: string;
  } | null;
  managerEmployee?: {
    id: string;
    fullName: string;
    companyEmail?: string | null;
  } | null;
};

export type BranchSummary = {
  id: string;
  name: string;
  code?: string | null;
  city?: string | null;
  isActive?: boolean;
};

export type Position = {
  id: string;
  name: string;
  code?: string | null;
  level?: number | null;
  isActive?: boolean;
  company?: {
    id: string;
    name: string;
    code?: string | null;
  } | null;
  _count?: {
    currentEmployees: number;
  };
};

export type EmployeeProfile = {
  id: string;
  employeeCode: string;
  companyEmail: string;
  personalEmail?: string | null;
  firstName?: string;
  lastName?: string;
  fullName: string;
  gender?: string | null;
  birthDate?: string | null;
  phoneNumber?: string | null;
  nationalId?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  employmentStatus: string;
  startDate: string;
  endDate?: string | null;
  company?: {
    id: string;
    name: string;
    code?: string | null;
  } | null;
  branch?: {
    id: string;
    name: string;
    code?: string | null;
    city?: string | null;
    address?: string | null;
  } | null;
  currentDepartment?: Department | null;
  currentPosition?: Position | null;
  defaultShift?: {
    id: string;
    code?: string | null;
    name: string;
    startMinute: number;
    endMinute: number;
    lateThresholdMinute: number;
    earlyLeaveThresholdMinute: number;
    overtimeStartMinute: number;
  } | null;
  manager?: {
    id: string;
    employeeCode?: string;
    fullName: string;
    companyEmail?: string | null;
    currentPosition?: Position | null;
  } | null;
  contracts?: EmploymentContract[];
  leaveBalances?: LeaveBalance[];
  attendanceRecords?: AttendanceRecord[];
  leaveRequests?: LeaveRequest[];
  overtimeRequests?: OvertimeRequest[];
  orgHistories?: EmployeeOrgHistory[];
  user?: {
    id: string;
    email: string;
    status: string;
    roles: Array<{
      id: string;
      role: {
        id: string;
        code: string;
        name: string;
      };
    }>;
  } | null;
};

export type EmployeeListResponse = {
  items: EmployeeProfile[];
  total: number;
  page: number;
  limit: number;
};

export type CreateEmployeePayload = {
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

export type EmploymentContract = {
  id: string;
  contractNumber?: string | null;
  contractType: string;
  baseSalary: string;
  salaryBasisAmount?: string | null;
  startDate: string;
  isPrimary: boolean;
  isActive: boolean;
  endDate?: string | null;
  salaryCurrency?: string;
};

export type EmployeeOrgHistory = {
  id: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  note?: string | null;
  department: Department;
  position: Position;
  managerEmployee?: {
    id: string;
    fullName: string;
    companyEmail?: string | null;
  } | null;
};

export type AttendanceRecord = {
  id: string;
  employeeId?: string;
  workDate: string;
  attendanceStatus: string;
  workedMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  checkInAt?: string | null;
  checkOutAt?: string | null;
};

export type OvertimeRequest = {
  id: string;
  workDate: string;
  totalMinutes: number;
  approvedMinutes?: number | null;
  overtimeDayType: string;
  multiplier: string;
  status: string;
  requestedNote?: string | null;
  decisionNote?: string | null;
  employee?: {
    id: string;
    fullName: string;
    employeeCode: string;
  };
};

export type AttendanceDashboard = {
  records: AttendanceRecord[];
  overtimeRequests: OvertimeRequest[];
};

export type AttendanceMonthlySummary = {
  year: number;
  month: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateCount: number;
  totalWorkedMinutes: number;
  totalOvertimeMinutes: number;
};

export type LeaveType = {
  id: string;
  code: string;
  name: string;
};

export type LeaveBalance = {
  id: string;
  employeeId?: string;
  year: number;
  openingBalance: string;
  accruedBalance: string;
  usedBalance: string;
  adjustedBalance: string;
  leaveType: LeaveType;
};

export type LeaveRequest = {
  id: string;
  employeeId?: string;
  fromDate: string;
  toDate: string;
  requestedDays: string;
  reason: string;
  status: string;
  submittedAt: string;
  decisionNote?: string | null;
  employee?: {
    id: string;
    fullName: string;
    employeeCode: string;
  };
  leaveType: LeaveType;
};

export type LeaveDashboard = {
  balances: LeaveBalance[];
  requests: LeaveRequest[];
};

export type NotificationItem = {
  id: string;
  userId?: string;
  type: string;
  title: string;
  body: string;
  status: string;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationList = {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
};

export type UnreadCount = {
  unreadCount: number;
};

export type TeamAttendanceSnapshotItem = {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  totalWorkedMinutes: number;
  totalOvertimeMinutes: number;
  lateCount: number;
  earlyLeaveCount: number;
};

export type TeamAttendanceSnapshot = {
  teamSize: number;
  items: TeamAttendanceSnapshotItem[];
};

export type TeamApprovalQueues = {
  leaveRequests: LeaveRequest[];
  overtimeRequests: OvertimeRequest[];
};

export type TeamMemberDetail = {
  profile: EmployeeProfile & {
    defaultShift?: {
      id: string;
      name: string;
      startMinute: number;
      endMinute: number;
    } | null;
    leaveBalances: LeaveBalance[];
    leaveRequests: LeaveRequest[];
    overtimeRequests: OvertimeRequest[];
    attendanceRecords: AttendanceRecord[];
  };
  summary: {
    recentAttendanceCount: number;
    recentLateCount: number;
    recentEarlyLeaveCount: number;
    recentOvertimeRequestCount: number;
    pendingLeaveRequestCount: number;
  };
};

export type DepartmentSummary = {
  id: string;
  name: string;
  employeeCount: number;
};

export type DepartmentListItem = Department & {
  isActive: boolean;
  currentEmployees: EmployeeProfile[];
  _count: {
    currentEmployees: number;
  };
  summary: {
    employeeCount: number;
    activeCount: number;
    managerCount: number;
    positions: number;
  };
};

export type DepartmentDetail = Department & {
  isActive: boolean;
  currentEmployees: EmployeeProfile[];
  _count: {
    currentEmployees: number;
  };
  summary: {
    employeeCount: number;
    activeCount: number;
    statusSummary: Record<string, number>;
    positionSummary: Record<string, number>;
  };
};

export type CreateDepartmentPayload = {
  branchId: string;
  name: string;
  code?: string;
  managerEmployeeId?: string | null;
};

export type CreatePositionPayload = {
  companyId: string;
  name: string;
  code?: string;
  level?: number;
  isActive?: boolean;
};

export type HrSummary = {
  filters: {
    departmentId?: string;
    employmentStatus?: string;
  };
  totalEmployees: number;
  activeEmployees: number;
  departments: DepartmentSummary[];
};

export type AttendanceSummary = {
  filters: Record<string, string | undefined | number>;
  year: number;
  month: number;
  totalRecords: number;
  presentCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  absentCount: number;
  totalWorkedMinutes: number;
  totalOvertimeMinutes: number;
};

export type LeaveSummary = {
  filters: Record<string, string | undefined | number>;
  year: number;
  month: number;
  totalRequests: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  byLeaveType: Array<{
    code: string;
    name: string;
    days: number;
  }>;
};

export type PayrollPeriod = {
  id: string;
  companyId?: string;
  branchId?: string | null;
  year: number;
  month: number;
  status: string;
  periodStart: string;
  periodEnd: string;
};

export type PayrollConfigContext = {
  company: {
    id: string;
    name: string;
    code?: string | null;
  };
  branches: BranchSummary[];
  defaultBranchId: string | null;
  latestPayrollPeriod?: {
    id: string;
    companyId: string;
    branchId?: string | null;
    year: number;
    month: number;
    status: string;
  } | null;
  availableRuleYears: number[];
};

export type InsuranceRuleVersionConfig = {
  id: string;
  companyId: string;
  year: number;
  effectiveFrom: string;
  employeeBhxhRate: string;
  employeeBhytRate: string;
  employeeBhtnRate: string;
  employerBhxhRate?: string | null;
  employerBhytRate?: string | null;
  employerBhtnRate?: string | null;
  salaryCap?: string | null;
  notes?: string | null;
};

export type TaxBracketConfig = {
  id?: string;
  bracketOrder: number;
  fromAmount: string;
  toAmount?: string | null;
  rate: string;
  quickDeduction?: string | null;
};

export type TaxRuleVersionConfig = {
  id: string;
  companyId: string;
  year: number;
  effectiveFrom: string;
  personalDeduction: string;
  dependentDeduction: string;
  notes?: string | null;
  brackets: TaxBracketConfig[];
};

export type PayrollRulesConfig = {
  companyId: string;
  year: number;
  insuranceRule: InsuranceRuleVersionConfig | null;
  taxRule: TaxRuleVersionConfig | null;
};

export type PayslipItem = {
  id: string;
  code: string;
  label: string;
  itemType: string;
  amount: string;
};

export type Payslip = {
  id: string;
  employeeId?: string;
  baseSalary: string;
  grossIncome: string;
  netIncome: string;
  status: string;
  publishedAt?: string | null;
  payrollPeriod?: PayrollPeriod;
  items: PayslipItem[];
};

export type PayrollSummary = {
  filters: Record<string, string | undefined | number>;
  year: number;
  month: number;
  totalPeriods: number;
  publishedPeriods: number;
  totalPayslips: number;
  totalGrossIncome: number;
  totalNetIncome: number;
  totalTaxDeduction: number;
  totalInsuranceDeduction: number;
};
