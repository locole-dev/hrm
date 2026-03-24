import "dotenv/config";

import {
  ApprovalStatus,
  AttendanceStatus,
  AuditAction,
  ContractType,
  NotificationStatus,
  NotificationType,
  PayslipItemType,
  PayslipStatus,
  PayrollPeriodStatus,
  PrismaClient,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { getPrismaClientOptions } from "../src/prisma/prisma-client-options";

const prisma = new PrismaClient(getPrismaClientOptions());

const ROLE_DEFINITIONS = [
  { code: "ADMIN", name: "Admin" },
  { code: "HR_MANAGER", name: "HR Manager" },
  { code: "HR", name: "HR" },
  { code: "PAYROLL", name: "Payroll" },
  { code: "MANAGER", name: "Manager" },
  { code: "EMPLOYEE", name: "Employee" },
];

const PERMISSION_DEFINITIONS = [
  { code: "auth.login", module: "auth", action: "login", name: "Login" },
  { code: "employees.read", module: "employees", action: "read", name: "Read employees" },
  { code: "employees.write", module: "employees", action: "write", name: "Write employees" },
  { code: "attendance.read", module: "attendance", action: "read", name: "Read attendance" },
  { code: "attendance.write", module: "attendance", action: "write", name: "Write attendance" },
  { code: "attendance.approve_ot", module: "attendance", action: "approve_ot", name: "Approve overtime" },
  { code: "leave.read", module: "leave", action: "read", name: "Read leave" },
  { code: "leave.write", module: "leave", action: "write", name: "Write leave" },
  { code: "leave.approve", module: "leave", action: "approve", name: "Approve leave" },
  { code: "notifications.read", module: "notifications", action: "read", name: "Read notifications" },
  { code: "notifications.write", module: "notifications", action: "write", name: "Write notifications" },
  { code: "manager.read", module: "manager", action: "read", name: "Read manager dashboard" },
  { code: "payroll.read", module: "payroll", action: "read", name: "Read payroll" },
  { code: "payroll.write", module: "payroll", action: "write", name: "Write payroll" },
  { code: "payroll.lock", module: "payroll", action: "lock", name: "Lock payroll" },
  { code: "reports.read", module: "reports", action: "read", name: "Read reports" },
];

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  ADMIN: PERMISSION_DEFINITIONS.map((permission) => permission.code),
  HR_MANAGER: [
    "employees.read",
    "employees.write",
    "attendance.read",
    "attendance.write",
    "attendance.approve_ot",
    "leave.read",
    "leave.write",
    "leave.approve",
    "notifications.read",
    "notifications.write",
    "manager.read",
    "payroll.read",
    "payroll.write",
    "payroll.lock",
    "reports.read",
  ],
  HR: [
    "employees.read",
    "employees.write",
    "attendance.read",
    "attendance.write",
    "leave.read",
    "leave.write",
    "notifications.read",
    "reports.read",
  ],
  PAYROLL: ["payroll.read", "payroll.write", "reports.read", "notifications.read"],
  MANAGER: [
    "attendance.read",
    "attendance.approve_ot",
    "leave.read",
    "leave.approve",
    "manager.read",
    "notifications.read",
  ],
  EMPLOYEE: [
    "auth.login",
    "employees.read",
    "attendance.read",
    "leave.read",
    "leave.write",
    "notifications.read",
    "notifications.write",
    "payroll.read",
  ],
};

function asDate(input: string) {
  return new Date(input);
}

async function seedCoreOrg() {
  const company = await prisma.company.upsert({
    where: { code: "HRM-HQ" },
    update: {},
    create: {
      code: "HRM-HQ",
      name: "HRM Company",
      defaultTimezone: "Asia/Bangkok",
      defaultCurrency: "VND",
    },
  });

  const branch = await prisma.branch.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: "Ha Noi",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      code: "HN",
      name: "Ha Noi",
      city: "Ha Noi",
      isActive: true,
    },
  });

  const hrDepartment = await prisma.department.upsert({
    where: {
      branchId_name: {
        branchId: branch.id,
        name: "Human Resources",
      },
    },
    update: {},
    create: {
      branchId: branch.id,
      code: "HR",
      name: "Human Resources",
      isActive: true,
    },
  });

  const engineeringDepartment = await prisma.department.upsert({
    where: {
      branchId_name: {
        branchId: branch.id,
        name: "Engineering",
      },
    },
    update: {},
    create: {
      branchId: branch.id,
      code: "ENG",
      name: "Engineering",
      isActive: true,
    },
  });

  const hrManagerPosition = await prisma.position.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: "HR Manager",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      code: "HR_MANAGER",
      name: "HR Manager",
      level: 1,
      isActive: true,
    },
  });

  const engineeringManagerPosition = await prisma.position.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: "Engineering Manager",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      code: "ENG_MANAGER",
      name: "Engineering Manager",
      level: 2,
      isActive: true,
    },
  });

  const softwareEngineerPosition = await prisma.position.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: "Software Engineer",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      code: "SOFTWARE_ENGINEER",
      name: "Software Engineer",
      level: 3,
      isActive: true,
    },
  });

  return {
    company,
    branch,
    hrDepartment,
    engineeringDepartment,
    hrManagerPosition,
    engineeringManagerPosition,
    softwareEngineerPosition,
  };
}

async function seedRolesAndPermissions() {
  for (const role of ROLE_DEFINITIONS) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: role,
    });
  }

  for (const permission of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: permission,
      create: permission,
    });
  }

  for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSION_MAP)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });

    for (const permissionCode of permissionCodes) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { code: permissionCode },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

async function seedLeaveTypes() {
  const leaveTypes = [
    {
      code: "ANNUAL_LEAVE",
      name: "Annual Leave",
      isPaid: true,
      deductsBalance: true,
      annualAllocation: 12,
      accrualPerMonth: 1,
    },
    {
      code: "UNPAID_LEAVE",
      name: "Unpaid Leave",
      isPaid: false,
      deductsBalance: false,
    },
    {
      code: "SICK_LEAVE",
      name: "Sick Leave",
      isPaid: true,
      deductsBalance: false,
    },
    {
      code: "OTHER_LEAVE",
      name: "Other Leave",
      isPaid: false,
      deductsBalance: false,
    },
  ];

  for (const leaveType of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { code: leaveType.code },
      update: leaveType,
      create: leaveType,
    });
  }
}

async function seedShift() {
  await prisma.attendanceShift.upsert({
    where: { code: "DEFAULT_OFFICE" },
    update: {},
    create: {
      code: "DEFAULT_OFFICE",
      name: "Default Office Shift",
      startMinute: 9 * 60,
      endMinute: 18 * 60,
      lateThresholdMinute: 9 * 60 + 5,
      earlyLeaveThresholdMinute: 17 * 60 + 55,
      overtimeStartMinute: 18 * 60 + 30,
    },
  });
}

async function seedHolidayCalendar(companyId: string) {
  const calendar = await prisma.holidayCalendar.upsert({
    where: {
      companyId_year: {
        companyId,
        year: 2026,
      },
    },
    update: {},
    create: {
      companyId,
      year: 2026,
      name: "Vietnam Holidays 2026",
      isActive: true,
    },
  });

  const holidays = [
    { holidayDate: asDate("2026-01-01"), name: "New Year", holidayType: "PUBLIC_HOLIDAY" as const },
    { holidayDate: asDate("2026-02-17"), name: "Company Kickoff", holidayType: "COMPANY_HOLIDAY" as const },
    { holidayDate: asDate("2026-04-30"), name: "Reunification Day", holidayType: "PUBLIC_HOLIDAY" as const },
    { holidayDate: asDate("2026-05-01"), name: "Labor Day", holidayType: "PUBLIC_HOLIDAY" as const },
    { holidayDate: asDate("2026-08-15"), name: "Founders Day", holidayType: "SPECIAL_DAY" as const },
    { holidayDate: asDate("2026-09-02"), name: "National Day", holidayType: "PUBLIC_HOLIDAY" as const },
  ];

  for (const holiday of holidays) {
    await prisma.holiday.upsert({
      where: {
        holidayCalendarId_holidayDate: {
          holidayCalendarId: calendar.id,
          holidayDate: holiday.holidayDate,
        },
      },
      update: {
        name: holiday.name,
        holidayType: holiday.holidayType,
      },
      create: {
        holidayCalendarId: calendar.id,
        holidayDate: holiday.holidayDate,
        name: holiday.name,
        holidayType: holiday.holidayType,
      },
    });
  }
}

async function assignRole(userId: string, roleCode: string) {
  const role = await prisma.role.findUniqueOrThrow({
    where: { code: roleCode },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId,
      roleId: role.id,
    },
  });
}

async function upsertUserAccount(input: {
  email: string;
  employeeId: string;
  password: string;
  roles: string[];
}) {
  const passwordHash = await hash(input.password, 10);

  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      employeeId: input.employeeId,
      passwordHash,
      status: "ACTIVE",
    },
    create: {
      employeeId: input.employeeId,
      email: input.email,
      passwordHash,
      status: "ACTIVE",
    },
  });

  for (const roleCode of input.roles) {
    await assignRole(user.id, roleCode);
  }

  return user;
}

async function seedRuleVersions(companyId: string) {
  const insuranceRuleVersion = await prisma.insuranceRuleVersion.upsert({
    where: {
      companyId_year_effectiveFrom: {
        companyId,
        year: 2026,
        effectiveFrom: asDate("2026-01-01"),
      },
    },
    update: {},
    create: {
      companyId,
      year: 2026,
      effectiveFrom: asDate("2026-01-01"),
      isActive: true,
      employeeBhxhRate: 0.08,
      employeeBhytRate: 0.015,
      employeeBhtnRate: 0.01,
      employerBhxhRate: 0.175,
      employerBhytRate: 0.03,
      employerBhtnRate: 0.01,
      salaryCap: 46800000,
      notes: "Sample insurance rule version",
    },
  });

  const taxRuleVersion = await prisma.taxRuleVersion.upsert({
    where: {
      companyId_year_effectiveFrom: {
        companyId,
        year: 2026,
        effectiveFrom: asDate("2026-01-01"),
      },
    },
    update: {},
    create: {
      companyId,
      year: 2026,
      effectiveFrom: asDate("2026-01-01"),
      isActive: true,
      personalDeduction: 11000000,
      dependentDeduction: 4400000,
      notes: "Sample PIT rule version",
    },
  });

  const brackets = [
    { bracketOrder: 1, fromAmount: 0, toAmount: 5000000, rate: 0.05, quickDeduction: 0 },
    { bracketOrder: 2, fromAmount: 5000000, toAmount: 10000000, rate: 0.1, quickDeduction: 250000 },
    { bracketOrder: 3, fromAmount: 10000000, toAmount: 18000000, rate: 0.15, quickDeduction: 750000 },
    { bracketOrder: 4, fromAmount: 18000000, toAmount: 32000000, rate: 0.2, quickDeduction: 1650000 },
    { bracketOrder: 5, fromAmount: 32000000, toAmount: 52000000, rate: 0.25, quickDeduction: 3250000 },
    { bracketOrder: 6, fromAmount: 52000000, toAmount: 80000000, rate: 0.3, quickDeduction: 5850000 },
    { bracketOrder: 7, fromAmount: 80000000, toAmount: null, rate: 0.35, quickDeduction: 9850000 },
  ];

  for (const bracket of brackets) {
    await prisma.taxBracket.upsert({
      where: {
        taxRuleVersionId_bracketOrder: {
          taxRuleVersionId: taxRuleVersion.id,
          bracketOrder: bracket.bracketOrder,
        },
      },
      update: {
        fromAmount: bracket.fromAmount,
        toAmount: bracket.toAmount,
        rate: bracket.rate,
        quickDeduction: bracket.quickDeduction,
      },
      create: {
        taxRuleVersionId: taxRuleVersion.id,
        ...bracket,
      },
    });
  }

  return { insuranceRuleVersion, taxRuleVersion };
}

async function seedSampleUsers(input: {
  companyId: string;
  branchId: string;
  hrDepartmentId: string;
  engineeringDepartmentId: string;
  hrManagerPositionId: string;
  engineeringManagerPositionId: string;
  softwareEngineerPositionId: string;
  shiftId: string;
}) {
  const hrManagerEmployee = await prisma.employee.upsert({
    where: { employeeCode: "HRM001" },
    update: {
      companyId: input.companyId,
      branchId: input.branchId,
      currentDepartmentId: input.hrDepartmentId,
      currentPositionId: input.hrManagerPositionId,
      defaultShiftId: input.shiftId,
      employmentStatus: "ACTIVE",
      currentManagerEmployeeId: null,
    },
    create: {
      companyId: input.companyId,
      branchId: input.branchId,
      employeeCode: "HRM001",
      companyEmail: "hr.manager@hrm.local",
      firstName: "Linh",
      lastName: "Nguyen",
      fullName: "Linh Nguyen",
      startDate: asDate("2025-07-01"),
      employmentStatus: "ACTIVE",
      currentDepartmentId: input.hrDepartmentId,
      currentPositionId: input.hrManagerPositionId,
      defaultShiftId: input.shiftId,
    },
  });

  const adminEmployee = await prisma.employee.upsert({
    where: { employeeCode: "ADMIN001" },
    update: {
      companyId: input.companyId,
      branchId: input.branchId,
      currentDepartmentId: input.hrDepartmentId,
      currentPositionId: input.hrManagerPositionId,
      defaultShiftId: input.shiftId,
      employmentStatus: "ACTIVE",
      currentManagerEmployeeId: hrManagerEmployee.id,
    },
    create: {
      companyId: input.companyId,
      branchId: input.branchId,
      employeeCode: "ADMIN001",
      companyEmail: "admin@hrm.local",
      firstName: "System",
      lastName: "Admin",
      fullName: "System Admin",
      startDate: asDate("2026-01-01"),
      employmentStatus: "ACTIVE",
      currentDepartmentId: input.hrDepartmentId,
      currentPositionId: input.hrManagerPositionId,
      currentManagerEmployeeId: hrManagerEmployee.id,
      defaultShiftId: input.shiftId,
    },
  });

  const managerEmployee = await prisma.employee.upsert({
    where: { employeeCode: "MGR001" },
    update: {
      companyId: input.companyId,
      branchId: input.branchId,
      currentDepartmentId: input.engineeringDepartmentId,
      currentPositionId: input.engineeringManagerPositionId,
      defaultShiftId: input.shiftId,
      employmentStatus: "ACTIVE",
      currentManagerEmployeeId: hrManagerEmployee.id,
    },
    create: {
      companyId: input.companyId,
      branchId: input.branchId,
      employeeCode: "MGR001",
      companyEmail: "manager@hrm.local",
      firstName: "Hoang",
      lastName: "Pham",
      fullName: "Hoang Pham",
      startDate: asDate("2025-08-01"),
      employmentStatus: "ACTIVE",
      currentDepartmentId: input.engineeringDepartmentId,
      currentPositionId: input.engineeringManagerPositionId,
      currentManagerEmployeeId: hrManagerEmployee.id,
      defaultShiftId: input.shiftId,
    },
  });

  const employeeOne = await prisma.employee.upsert({
    where: { employeeCode: "EMP001" },
    update: {
      companyId: input.companyId,
      branchId: input.branchId,
      currentDepartmentId: input.engineeringDepartmentId,
      currentPositionId: input.softwareEngineerPositionId,
      defaultShiftId: input.shiftId,
      currentManagerEmployeeId: managerEmployee.id,
      employmentStatus: "ACTIVE",
    },
    create: {
      companyId: input.companyId,
      branchId: input.branchId,
      employeeCode: "EMP001",
      companyEmail: "ngoc.tran@hrm.local",
      firstName: "Ngoc",
      lastName: "Tran",
      fullName: "Ngoc Tran",
      startDate: asDate("2026-01-06"),
      employmentStatus: "ACTIVE",
      currentDepartmentId: input.engineeringDepartmentId,
      currentPositionId: input.softwareEngineerPositionId,
      currentManagerEmployeeId: managerEmployee.id,
      defaultShiftId: input.shiftId,
    },
  });

  const employeeTwo = await prisma.employee.upsert({
    where: { employeeCode: "EMP002" },
    update: {
      companyId: input.companyId,
      branchId: input.branchId,
      currentDepartmentId: input.engineeringDepartmentId,
      currentPositionId: input.softwareEngineerPositionId,
      defaultShiftId: input.shiftId,
      currentManagerEmployeeId: managerEmployee.id,
      employmentStatus: "PROBATION",
    },
    create: {
      companyId: input.companyId,
      branchId: input.branchId,
      employeeCode: "EMP002",
      companyEmail: "minh.le@hrm.local",
      firstName: "Minh",
      lastName: "Le",
      fullName: "Minh Le",
      startDate: asDate("2026-02-10"),
      employmentStatus: "PROBATION",
      currentDepartmentId: input.engineeringDepartmentId,
      currentPositionId: input.softwareEngineerPositionId,
      currentManagerEmployeeId: managerEmployee.id,
      defaultShiftId: input.shiftId,
    },
  });

  await prisma.department.update({
    where: { id: input.hrDepartmentId },
    data: { managerEmployeeId: hrManagerEmployee.id },
  });

  await prisma.department.update({
    where: { id: input.engineeringDepartmentId },
    data: { managerEmployeeId: managerEmployee.id },
  });

  const hrManagerUser = await upsertUserAccount({
    email: "hr.manager@hrm.local",
    employeeId: hrManagerEmployee.id,
    password: "HrManager@123456",
    roles: ["HR_MANAGER"],
  });

  const adminUser = await upsertUserAccount({
    email: "admin@hrm.local",
    employeeId: adminEmployee.id,
    password: "Admin@123456",
    roles: ["ADMIN"],
  });

  const managerUser = await upsertUserAccount({
    email: "manager@hrm.local",
    employeeId: managerEmployee.id,
    password: "Manager@123456",
    roles: ["MANAGER"],
  });

  const employeeOneUser = await upsertUserAccount({
    email: "ngoc.tran@hrm.local",
    employeeId: employeeOne.id,
    password: "Employee@123456",
    roles: ["EMPLOYEE"],
  });

  const employeeTwoUser = await upsertUserAccount({
    email: "minh.le@hrm.local",
    employeeId: employeeTwo.id,
    password: "Employee@123456",
    roles: ["EMPLOYEE"],
  });

  return {
    hrManagerEmployee,
    adminEmployee,
    managerEmployee,
    employeeOne,
    employeeTwo,
    hrManagerUser,
    adminUser,
    managerUser,
    employeeOneUser,
    employeeTwoUser,
  };
}

async function upsertPrimaryContract(input: {
  employeeId: string;
  contractNumber: string;
  startDate: string;
  baseSalary: number;
  salaryBasisAmount: number;
}) {
  const existing = await prisma.employmentContract.findFirst({
    where: {
      employeeId: input.employeeId,
      contractNumber: input.contractNumber,
    },
  });

  if (existing) {
    return prisma.employmentContract.update({
      where: { id: existing.id },
      data: {
        contractType: ContractType.INDEFINITE,
        startDate: asDate(input.startDate),
        baseSalary: input.baseSalary,
        salaryBasisAmount: input.salaryBasisAmount,
        isPrimary: true,
        isActive: true,
      },
    });
  }

  return prisma.employmentContract.create({
    data: {
      employeeId: input.employeeId,
      contractType: ContractType.INDEFINITE,
      contractNumber: input.contractNumber,
      startDate: asDate(input.startDate),
      baseSalary: input.baseSalary,
      salaryBasisAmount: input.salaryBasisAmount,
      isPrimary: true,
      isActive: true,
    },
  });
}

async function seedContracts(sampleUsers: Awaited<ReturnType<typeof seedSampleUsers>>) {
  const hrManagerContract = await upsertPrimaryContract({
    employeeId: sampleUsers.hrManagerEmployee.id,
    contractNumber: "CTR-HRM-2025",
    startDate: "2025-07-01",
    baseSalary: 30000000,
    salaryBasisAmount: 30000000,
  });

  const adminContract = await upsertPrimaryContract({
    employeeId: sampleUsers.adminEmployee.id,
    contractNumber: "CTR-ADMIN-2026",
    startDate: "2026-01-01",
    baseSalary: 35000000,
    salaryBasisAmount: 35000000,
  });

  const managerContract = await upsertPrimaryContract({
    employeeId: sampleUsers.managerEmployee.id,
    contractNumber: "CTR-MGR-2025",
    startDate: "2025-08-01",
    baseSalary: 42000000,
    salaryBasisAmount: 42000000,
  });

  const employeeOneContract = await upsertPrimaryContract({
    employeeId: sampleUsers.employeeOne.id,
    contractNumber: "CTR-EMP001-2026",
    startDate: "2026-01-06",
    baseSalary: 22000000,
    salaryBasisAmount: 22000000,
  });

  const employeeTwoContract = await upsertPrimaryContract({
    employeeId: sampleUsers.employeeTwo.id,
    contractNumber: "CTR-EMP002-2026",
    startDate: "2026-02-10",
    baseSalary: 18000000,
    salaryBasisAmount: 18000000,
  });

  return {
    hrManagerContract,
    adminContract,
    managerContract,
    employeeOneContract,
    employeeTwoContract,
  };
}

async function seedLeaveBalances(sampleUsers: Awaited<ReturnType<typeof seedSampleUsers>>) {
  const annualLeave = await prisma.leaveType.findUniqueOrThrow({
    where: { code: "ANNUAL_LEAVE" },
  });

  const balances = [
    { employeeId: sampleUsers.hrManagerEmployee.id, openingBalance: 12, accruedBalance: 3, usedBalance: 0.5 },
    { employeeId: sampleUsers.managerEmployee.id, openingBalance: 12, accruedBalance: 3, usedBalance: 1 },
    { employeeId: sampleUsers.employeeOne.id, openingBalance: 12, accruedBalance: 3, usedBalance: 1 },
    { employeeId: sampleUsers.employeeTwo.id, openingBalance: 12, accruedBalance: 2, usedBalance: 0.5 },
  ];

  for (const balance of balances) {
    const leaveBalance = await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: balance.employeeId,
          leaveTypeId: annualLeave.id,
          year: 2026,
        },
      },
      update: balance,
      create: {
        leaveTypeId: annualLeave.id,
        year: 2026,
        adjustedBalance: 0,
        ...balance,
      },
    });

    await prisma.leaveAccrualLedger.deleteMany({
      where: {
        leaveBalanceId: leaveBalance.id,
        sourceReference: {
          startsWith: "sample:",
        },
      },
    });

    await prisma.leaveAccrualLedger.createMany({
      data: [
        {
          leaveBalanceId: leaveBalance.id,
          entryType: "ACCRUAL",
          effectiveDate: asDate("2026-01-01"),
          amount: 1,
          sourceReference: "sample:opening",
          note: "Sample opening accrual",
        },
        {
          leaveBalanceId: leaveBalance.id,
          entryType: "ACCRUAL",
          effectiveDate: asDate("2026-03-01"),
          amount: 1,
          sourceReference: "sample:march",
          note: "Sample monthly accrual",
        },
      ],
    });
  }

  return annualLeave;
}

async function seedAttendanceAndOvertime(sampleUsers: Awaited<ReturnType<typeof seedSampleUsers>>) {
  const sampleRecords = [
    {
      employeeId: sampleUsers.hrManagerEmployee.id,
      workDate: "2026-03-06",
      checkInAt: "2026-03-06T02:00:00.000Z",
      checkOutAt: "2026-03-06T09:20:00.000Z",
      workedMinutes: 440,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 20,
      attendanceStatus: AttendanceStatus.PRESENT,
    },
    {
      employeeId: sampleUsers.managerEmployee.id,
      workDate: "2026-03-05",
      checkInAt: "2026-03-05T02:03:00.000Z",
      checkOutAt: "2026-03-05T10:10:00.000Z",
      workedMinutes: 487,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 100,
      attendanceStatus: AttendanceStatus.PRESENT,
    },
    {
      employeeId: sampleUsers.employeeOne.id,
      workDate: "2026-03-02",
      checkInAt: "2026-03-02T02:07:00.000Z",
      checkOutAt: "2026-03-02T09:05:00.000Z",
      workedMinutes: 418,
      lateMinutes: 2,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 35,
      attendanceStatus: AttendanceStatus.LATE,
    },
    {
      employeeId: sampleUsers.employeeOne.id,
      workDate: "2026-03-03",
      checkInAt: "2026-03-03T02:00:00.000Z",
      checkOutAt: "2026-03-03T09:45:00.000Z",
      workedMinutes: 465,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 75,
      attendanceStatus: AttendanceStatus.PRESENT,
    },
    {
      employeeId: sampleUsers.employeeTwo.id,
      workDate: "2026-03-02",
      checkInAt: "2026-03-02T01:59:00.000Z",
      checkOutAt: "2026-03-02T08:50:00.000Z",
      workedMinutes: 411,
      lateMinutes: 0,
      earlyLeaveMinutes: 5,
      overtimeMinutes: 0,
      attendanceStatus: AttendanceStatus.EARLY_LEAVE,
    },
    {
      employeeId: sampleUsers.employeeTwo.id,
      workDate: "2026-03-04",
      checkInAt: "2026-03-04T02:04:00.000Z",
      checkOutAt: "2026-03-04T09:50:00.000Z",
      workedMinutes: 466,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 80,
      attendanceStatus: AttendanceStatus.PRESENT,
    },
  ];

  for (const record of sampleRecords) {
    const attendanceRecord = await prisma.attendanceRecord.upsert({
      where: {
        employeeId_workDate: {
          employeeId: record.employeeId,
          workDate: asDate(record.workDate),
        },
      },
      update: {
        checkInAt: asDate(record.checkInAt),
        checkOutAt: asDate(record.checkOutAt),
        workedMinutes: record.workedMinutes,
        lateMinutes: record.lateMinutes,
        earlyLeaveMinutes: record.earlyLeaveMinutes,
        overtimeMinutes: record.overtimeMinutes,
        attendanceStatus: record.attendanceStatus,
      },
      create: {
        employeeId: record.employeeId,
        workDate: asDate(record.workDate),
        checkInAt: asDate(record.checkInAt),
        checkOutAt: asDate(record.checkOutAt),
        workedMinutes: record.workedMinutes,
        lateMinutes: record.lateMinutes,
        earlyLeaveMinutes: record.earlyLeaveMinutes,
        overtimeMinutes: record.overtimeMinutes,
        attendanceStatus: record.attendanceStatus,
      },
    });

    await prisma.attendanceEvent.deleteMany({
      where: {
        attendanceRecordId: attendanceRecord.id,
      },
    });

    await prisma.attendanceEvent.createMany({
      data: [
        {
          attendanceRecordId: attendanceRecord.id,
          eventType: "CHECK_IN",
          occurredAt: asDate(record.checkInAt),
          source: "seed",
          note: "Sample check-in",
        },
        {
          attendanceRecordId: attendanceRecord.id,
          eventType: "CHECK_OUT",
          occurredAt: asDate(record.checkOutAt),
          source: "seed",
          note: "Sample check-out",
        },
      ],
    });
  }

  const managerAttendance = await prisma.attendanceRecord.findUniqueOrThrow({
    where: {
      employeeId_workDate: {
        employeeId: sampleUsers.managerEmployee.id,
        workDate: asDate("2026-03-05"),
      },
    },
  });

  const employeeOneAttendance = await prisma.attendanceRecord.findUniqueOrThrow({
    where: {
      employeeId_workDate: {
        employeeId: sampleUsers.employeeOne.id,
        workDate: asDate("2026-03-03"),
      },
    },
  });

  const employeeTwoAttendance = await prisma.attendanceRecord.findUniqueOrThrow({
    where: {
      employeeId_workDate: {
        employeeId: sampleUsers.employeeTwo.id,
        workDate: asDate("2026-03-04"),
      },
    },
  });

  await prisma.overtimeRequest.deleteMany({
    where: {
      employeeId: {
        in: [
          sampleUsers.managerEmployee.id,
          sampleUsers.employeeOne.id,
          sampleUsers.employeeTwo.id,
        ],
      },
      workDate: {
        in: [asDate("2026-03-03"), asDate("2026-03-04"), asDate("2026-03-05")],
      },
    },
  });

  await prisma.overtimeRequest.createMany({
    data: [
      {
        employeeId: sampleUsers.managerEmployee.id,
        attendanceRecordId: managerAttendance.id,
        workDate: asDate("2026-03-05"),
        startAt: asDate("2026-03-05T09:20:00.000Z"),
        endAt: asDate("2026-03-05T10:20:00.000Z"),
        totalMinutes: 60,
        overtimeDayType: "WEEKDAY",
        multiplier: 1.5,
        status: ApprovalStatus.PENDING,
        requestedNote: "Architecture review with vendor",
      },
      {
        employeeId: sampleUsers.employeeOne.id,
        attendanceRecordId: employeeOneAttendance.id,
        workDate: asDate("2026-03-03"),
        startAt: asDate("2026-03-03T09:30:00.000Z"),
        endAt: asDate("2026-03-03T11:00:00.000Z"),
        totalMinutes: 90,
        overtimeDayType: "WEEKDAY",
        multiplier: 1.5,
        status: ApprovalStatus.PENDING,
        requestedNote: "Sprint release support",
      },
      {
        employeeId: sampleUsers.employeeTwo.id,
        attendanceRecordId: employeeTwoAttendance.id,
        workDate: asDate("2026-03-04"),
        startAt: asDate("2026-03-04T09:30:00.000Z"),
        endAt: asDate("2026-03-04T10:50:00.000Z"),
        totalMinutes: 80,
        approvedMinutes: 80,
        overtimeDayType: "WEEKDAY",
        multiplier: 1.5,
        status: ApprovalStatus.APPROVED,
        requestedNote: "Bugfix deployment support",
        decisionNote: "Approved for release support",
        approvedByUserId: sampleUsers.managerUser.id,
        approvedAt: asDate("2026-03-04T12:00:00.000Z"),
      },
    ],
  });
}

async function seedLeaveRequests(
  sampleUsers: Awaited<ReturnType<typeof seedSampleUsers>>,
  annualLeaveId: string,
) {
  await prisma.leaveRequest.deleteMany({
    where: {
      employeeId: {
        in: [
          sampleUsers.managerEmployee.id,
          sampleUsers.employeeOne.id,
          sampleUsers.employeeTwo.id,
        ],
      },
      fromDate: {
        in: [asDate("2026-03-20"), asDate("2026-03-25"), asDate("2026-03-28")],
      },
    },
  });

  const managerPendingLeave = await prisma.leaveRequest.create({
    data: {
      employeeId: sampleUsers.managerEmployee.id,
      leaveTypeId: annualLeaveId,
      fromDate: asDate("2026-03-28"),
      toDate: asDate("2026-03-28"),
      requestedDays: 1,
      reason: "Leadership offsite",
      status: ApprovalStatus.PENDING,
      submittedAt: asDate("2026-03-18T03:00:00.000Z"),
    },
  });

  const pendingLeave = await prisma.leaveRequest.create({
    data: {
      employeeId: sampleUsers.employeeOne.id,
      leaveTypeId: annualLeaveId,
      fromDate: asDate("2026-03-20"),
      toDate: asDate("2026-03-21"),
      requestedDays: 2,
      reason: "Family event",
      status: ApprovalStatus.PENDING,
      submittedAt: asDate("2026-03-10T01:30:00.000Z"),
    },
  });

  const approvedLeave = await prisma.leaveRequest.create({
    data: {
      employeeId: sampleUsers.employeeTwo.id,
      leaveTypeId: annualLeaveId,
      fromDate: asDate("2026-03-25"),
      toDate: asDate("2026-03-25"),
      requestedDays: 1,
      reason: "Medical appointment",
      status: ApprovalStatus.APPROVED,
      submittedAt: asDate("2026-03-12T02:00:00.000Z"),
      decidedAt: asDate("2026-03-12T08:00:00.000Z"),
      decisionNote: "Approved by manager",
    },
  });

  await prisma.leaveApproval.createMany({
    data: [
      {
        leaveRequestId: managerPendingLeave.id,
        approverUserId: sampleUsers.hrManagerUser.id,
        stepOrder: 1,
        status: ApprovalStatus.PENDING,
      },
      {
        leaveRequestId: pendingLeave.id,
        approverUserId: sampleUsers.managerUser.id,
        stepOrder: 1,
        status: ApprovalStatus.PENDING,
      },
      {
        leaveRequestId: approvedLeave.id,
        approverUserId: sampleUsers.managerUser.id,
        stepOrder: 1,
        status: ApprovalStatus.APPROVED,
        note: "Approved",
        decidedAt: asDate("2026-03-12T08:00:00.000Z"),
      },
    ],
  });
}

async function seedPayrollArtifacts(input: {
  companyId: string;
  branchId: string;
  insuranceRuleVersionId: string;
  taxRuleVersionId: string;
  sampleUsers: Awaited<ReturnType<typeof seedSampleUsers>>;
  contracts: Awaited<ReturnType<typeof seedContracts>>;
}) {
  const payrollPeriod = await prisma.payrollPeriod.upsert({
    where: {
      companyId_year_month: {
        companyId: input.companyId,
        year: 2026,
        month: 3,
      },
    },
    update: {
      branchId: input.branchId,
      insuranceRuleVersionId: input.insuranceRuleVersionId,
      taxRuleVersionId: input.taxRuleVersionId,
      periodStart: asDate("2026-03-01"),
      periodEnd: asDate("2026-03-31"),
      status: PayrollPeriodStatus.PUBLISHED,
      lockedByUserId: input.sampleUsers.adminUser.id,
      lockedAt: asDate("2026-03-31T10:00:00.000Z"),
      publishedByUserId: input.sampleUsers.adminUser.id,
      publishedAt: asDate("2026-03-31T11:00:00.000Z"),
    },
    create: {
      companyId: input.companyId,
      branchId: input.branchId,
      insuranceRuleVersionId: input.insuranceRuleVersionId,
      taxRuleVersionId: input.taxRuleVersionId,
      year: 2026,
      month: 3,
      periodStart: asDate("2026-03-01"),
      periodEnd: asDate("2026-03-31"),
      status: PayrollPeriodStatus.PUBLISHED,
      lockedByUserId: input.sampleUsers.adminUser.id,
      lockedAt: asDate("2026-03-31T10:00:00.000Z"),
      publishedByUserId: input.sampleUsers.adminUser.id,
      publishedAt: asDate("2026-03-31T11:00:00.000Z"),
    },
  });

  await prisma.payslip.deleteMany({
    where: {
      payrollPeriodId: payrollPeriod.id,
      employeeId: {
        in: [
          input.sampleUsers.hrManagerEmployee.id,
          input.sampleUsers.managerEmployee.id,
          input.sampleUsers.employeeOne.id,
          input.sampleUsers.employeeTwo.id,
        ],
      },
    },
  });

  const payslips = [
    {
      employeeId: input.sampleUsers.hrManagerEmployee.id,
      contractId: input.contracts.hrManagerContract.id,
      baseSalary: 30000000,
      overtimePayTotal: 180000,
      attendanceDeductionTotal: 0,
      insuranceDeductionTotal: 3150000,
      taxDeductionTotal: 1070000,
      grossIncome: 30180000,
      preTaxIncome: 27030000,
      netIncome: 25960000,
    },
    {
      employeeId: input.sampleUsers.managerEmployee.id,
      contractId: input.contracts.managerContract.id,
      baseSalary: 42000000,
      overtimePayTotal: 0,
      attendanceDeductionTotal: 0,
      insuranceDeductionTotal: 4410000,
      taxDeductionTotal: 1950000,
      grossIncome: 42000000,
      preTaxIncome: 37590000,
      netIncome: 35640000,
    },
    {
      employeeId: input.sampleUsers.employeeOne.id,
      contractId: input.contracts.employeeOneContract.id,
      baseSalary: 22000000,
      overtimePayTotal: 765000,
      attendanceDeductionTotal: 150000,
      insuranceDeductionTotal: 2310000,
      taxDeductionTotal: 420000,
      grossIncome: 22765000,
      preTaxIncome: 20455000,
      netIncome: 20035000,
    },
    {
      employeeId: input.sampleUsers.employeeTwo.id,
      contractId: input.contracts.employeeTwoContract.id,
      baseSalary: 18000000,
      overtimePayTotal: 720000,
      attendanceDeductionTotal: 0,
      insuranceDeductionTotal: 1890000,
      taxDeductionTotal: 180000,
      grossIncome: 18720000,
      preTaxIncome: 16830000,
      netIncome: 16650000,
    },
  ];

  for (const payslip of payslips) {
    const createdPayslip = await prisma.payslip.create({
      data: {
        payrollPeriodId: payrollPeriod.id,
        employeeId: payslip.employeeId,
        contractId: payslip.contractId,
        insuranceRuleVersionId: input.insuranceRuleVersionId,
        taxRuleVersionId: input.taxRuleVersionId,
        baseSalary: payslip.baseSalary,
        overtimePayTotal: payslip.overtimePayTotal,
        attendanceDeductionTotal: payslip.attendanceDeductionTotal,
        insuranceDeductionTotal: payslip.insuranceDeductionTotal,
        taxDeductionTotal: payslip.taxDeductionTotal,
        grossIncome: payslip.grossIncome,
        preTaxIncome: payslip.preTaxIncome,
        netIncome: payslip.netIncome,
        status: PayslipStatus.PUBLISHED,
        publishedAt: asDate("2026-03-31T11:00:00.000Z"),
        insuranceRuleSnapshot: {
          year: 2026,
          employeeRates: {
            bhxh: 0.08,
            bhyt: 0.015,
            bhtn: 0.01,
          },
        },
        taxRuleSnapshot: {
          year: 2026,
          personalDeduction: 11000000,
        },
      },
    });

    await prisma.payslipItem.createMany({
      data: [
        {
          payslipId: createdPayslip.id,
          itemType: PayslipItemType.BASE_SALARY,
          code: "BASE",
          label: "Base Salary",
          amount: payslip.baseSalary,
        },
        {
          payslipId: createdPayslip.id,
          itemType: PayslipItemType.OVERTIME,
          code: "OT",
          label: "Overtime Pay",
          amount: payslip.overtimePayTotal,
        },
        {
          payslipId: createdPayslip.id,
          itemType: PayslipItemType.ATTENDANCE_DEDUCTION,
          code: "ATTENDANCE_DEDUCTION",
          label: "Attendance Deduction",
          amount: payslip.attendanceDeductionTotal,
        },
        {
          payslipId: createdPayslip.id,
          itemType: PayslipItemType.INSURANCE_DEDUCTION,
          code: "INSURANCE",
          label: "Insurance Deduction",
          amount: payslip.insuranceDeductionTotal,
        },
        {
          payslipId: createdPayslip.id,
          itemType: PayslipItemType.TAX_DEDUCTION,
          code: "PIT",
          label: "Tax Deduction",
          amount: payslip.taxDeductionTotal,
        },
      ],
    });
  }
}

async function seedNotifications(sampleUsers: Awaited<ReturnType<typeof seedSampleUsers>>) {
  await prisma.notification.deleteMany({
    where: {
      userId: {
        in: [
          sampleUsers.hrManagerUser.id,
          sampleUsers.managerUser.id,
          sampleUsers.employeeOneUser.id,
          sampleUsers.employeeTwoUser.id,
        ],
      },
      title: {
        in: [
          "Leave request submitted",
          "Leave approved",
          "Payslip published",
        ],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: sampleUsers.hrManagerUser.id,
        type: NotificationType.LEAVE_SUBMITTED,
        title: "Leave request submitted",
        body: "Hoang Pham submitted a leave request for approval",
        status: NotificationStatus.UNREAD,
      },
      {
        userId: sampleUsers.hrManagerUser.id,
        type: NotificationType.PAYSLIP_PUBLISHED,
        title: "Payslip published",
        body: "Your payslip for 03/2026 is ready",
        status: NotificationStatus.READ,
        readAt: asDate("2026-03-31T11:10:00.000Z"),
      },
      {
        userId: sampleUsers.managerUser.id,
        type: NotificationType.LEAVE_SUBMITTED,
        title: "Leave request submitted",
        body: "Ngoc Tran submitted a leave request for approval",
        status: NotificationStatus.UNREAD,
      },
      {
        userId: sampleUsers.employeeTwoUser.id,
        type: NotificationType.LEAVE_APPROVED,
        title: "Leave approved",
        body: "Your leave request on 2026-03-25 has been approved",
        status: NotificationStatus.READ,
        readAt: asDate("2026-03-12T08:10:00.000Z"),
      },
      {
        userId: sampleUsers.employeeOneUser.id,
        type: NotificationType.PAYSLIP_PUBLISHED,
        title: "Payslip published",
        body: "Your payslip for 03/2026 is ready",
        status: NotificationStatus.UNREAD,
      },
    ],
  });
}

async function seedAuditLogs(sampleUsers: Awaited<ReturnType<typeof seedSampleUsers>>) {
  await prisma.auditLog.deleteMany({
    where: {
      entityType: {
        in: ["SampleLeaveRequest", "SamplePayrollPeriod"],
      },
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: sampleUsers.managerUser.id,
        action: AuditAction.APPROVE,
        entityType: "SampleLeaveRequest",
        entityId: sampleUsers.employeeTwo.id,
        entityLabel: "Approved leave request for Minh Le",
        metadata: {
          source: "seed",
        },
      },
      {
        actorUserId: sampleUsers.adminUser.id,
        action: AuditAction.LOCK,
        entityType: "SamplePayrollPeriod",
        entityId: "2026-03",
        entityLabel: "Locked payroll period 2026-03",
        metadata: {
          source: "seed",
        },
      },
    ],
  });
}

async function main() {
  const org = await seedCoreOrg();
  await seedRolesAndPermissions();
  await seedLeaveTypes();
  await seedShift();
  await seedHolidayCalendar(org.company.id);
  const defaultShift = await prisma.attendanceShift.findUniqueOrThrow({
    where: { code: "DEFAULT_OFFICE" },
  });
  const sampleUsers = await seedSampleUsers({
    companyId: org.company.id,
    branchId: org.branch.id,
    hrDepartmentId: org.hrDepartment.id,
    engineeringDepartmentId: org.engineeringDepartment.id,
    hrManagerPositionId: org.hrManagerPosition.id,
    engineeringManagerPositionId: org.engineeringManagerPosition.id,
    softwareEngineerPositionId: org.softwareEngineerPosition.id,
    shiftId: defaultShift.id,
  });
  const contracts = await seedContracts(sampleUsers);
  const annualLeave = await seedLeaveBalances(sampleUsers);
  await seedAttendanceAndOvertime(sampleUsers);
  await seedLeaveRequests(sampleUsers, annualLeave.id);
  const ruleVersions = await seedRuleVersions(org.company.id);
  await seedPayrollArtifacts({
    companyId: org.company.id,
    branchId: org.branch.id,
    insuranceRuleVersionId: ruleVersions.insuranceRuleVersion.id,
    taxRuleVersionId: ruleVersions.taxRuleVersion.id,
    sampleUsers,
    contracts,
  });
  await seedNotifications(sampleUsers);
  await seedAuditLogs(sampleUsers);

  console.log("Seed completed.");
  console.log("HR Manager: hr.manager@hrm.local / HrManager@123456");
  console.log("Admin: admin@hrm.local / Admin@123456");
  console.log("Manager: manager@hrm.local / Manager@123456");
  console.log("Employee 1: ngoc.tran@hrm.local / Employee@123456");
  console.log("Employee 2: minh.le@hrm.local / Employee@123456");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
