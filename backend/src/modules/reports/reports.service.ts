import { Injectable } from "@nestjs/common";
import {
  ApprovalStatus,
  AttendanceStatus,
  EmploymentStatus,
  PayslipStatus,
  PayrollPeriodStatus,
  Prisma,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { AttendanceReportQueryDto } from "./dto/attendance-report-query.dto";
import { HrSummaryQueryDto } from "./dto/hr-summary-query.dto";
import { LeaveReportQueryDto } from "./dto/leave-report-query.dto";
import { PayrollReportQueryDto } from "./dto/payroll-report-query.dto";

type CsvCell = string | number | null | undefined;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildCsv(rows: CsvCell[][]) {
    return rows
      .map((row) =>
        row
          .map((value) => {
            const normalized = value == null ? "" : String(value);
            const escaped = normalized.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(","),
      )
      .join("\n");
  }

  private getAttendanceDateRange(year: number, month: number) {
    return {
      start: new Date(Date.UTC(year, month - 1, 1)),
      end: new Date(Date.UTC(year, month, 0)),
    };
  }

  private buildHrEmployeeWhere(query: HrSummaryQueryDto): Prisma.EmployeeWhereInput {
    return {
      ...(query.departmentId ? { currentDepartmentId: query.departmentId } : {}),
      ...(query.employmentStatus
        ? { employmentStatus: query.employmentStatus }
        : {}),
    };
  }

  private buildAttendanceWhere(
    query: AttendanceReportQueryDto,
  ): Prisma.AttendanceRecordWhereInput {
    const { start, end } = this.getAttendanceDateRange(query.year, query.month);

    return {
      workDate: { gte: start, lte: end },
      ...(query.attendanceStatus
        ? { attendanceStatus: query.attendanceStatus }
        : {}),
      ...(query.departmentId
        ? { employee: { currentDepartmentId: query.departmentId } }
        : {}),
    };
  }

  private buildLeaveWhere(
    query: LeaveReportQueryDto,
  ): Prisma.LeaveRequestWhereInput {
    const { start, end } = this.getAttendanceDateRange(query.year, query.month);

    return {
      fromDate: { lte: end },
      toDate: { gte: start },
      ...(query.status ? { status: query.status } : {}),
      ...(query.leaveTypeId ? { leaveTypeId: query.leaveTypeId } : {}),
      ...(query.departmentId
        ? { employee: { currentDepartmentId: query.departmentId } }
        : {}),
    };
  }

  private buildPayrollPeriodWhere(
    query: PayrollReportQueryDto,
  ): Prisma.PayrollPeriodWhereInput {
    return {
      year: query.year,
      month: query.month,
      ...(query.periodStatus ? { status: query.periodStatus } : {}),
    };
  }

  private buildPayslipWhere(
    query: PayrollReportQueryDto,
  ): Prisma.PayslipWhereInput {
    return {
      payrollPeriod: this.buildPayrollPeriodWhere(query),
      ...(query.payslipStatus ? { status: query.payslipStatus } : {}),
      ...(query.departmentId
        ? { employee: { currentDepartmentId: query.departmentId } }
        : {}),
    };
  }

  async getHrSummary(query: HrSummaryQueryDto) {
    const where = this.buildHrEmployeeWhere(query);

    const [totalEmployees, activeEmployees, departmentSummary] =
      await this.prisma.$transaction([
        this.prisma.employee.count({ where }),
        this.prisma.employee.count({
          where: {
            ...where,
            employmentStatus: query.employmentStatus ?? {
              in: [EmploymentStatus.ACTIVE, EmploymentStatus.PROBATION],
            },
          },
        }),
        this.prisma.department.findMany({
          where: query.departmentId ? { id: query.departmentId } : undefined,
          include: {
            _count: {
              select: {
                currentEmployees: {
                  where: query.employmentStatus
                    ? { employmentStatus: query.employmentStatus }
                    : undefined,
                },
              },
            },
          },
          orderBy: { name: "asc" },
        }),
      ]);

    return {
      filters: query,
      totalEmployees,
      activeEmployees,
      departments: departmentSummary.map((department) => ({
        id: department.id,
        name: department.name,
        employeeCount: department._count.currentEmployees,
      })),
    };
  }

  async exportHrSummaryCsv(query: HrSummaryQueryDto) {
    const summary = await this.getHrSummary(query);

    return this.buildCsv([
      ["metric", "value"],
      ["totalEmployees", summary.totalEmployees],
      ["activeEmployees", summary.activeEmployees],
      [],
      ["departmentId", "departmentName", "employeeCount"],
      ...summary.departments.map((department) => [
        department.id,
        department.name,
        department.employeeCount,
      ]),
    ]);
  }

  async getAttendanceSummary(query: AttendanceReportQueryDto) {
    const where = this.buildAttendanceWhere(query);

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          include: {
            currentDepartment: true,
          },
        },
      },
    });

    return {
      filters: query,
      year: query.year,
      month: query.month,
      totalRecords: records.length,
      presentCount: records.filter(
        (record) => record.attendanceStatus === AttendanceStatus.PRESENT,
      ).length,
      lateCount: records.filter((record) => record.lateMinutes > 0).length,
      earlyLeaveCount: records.filter((record) => record.earlyLeaveMinutes > 0)
        .length,
      absentCount: records.filter(
        (record) => record.attendanceStatus === AttendanceStatus.ABSENT,
      ).length,
      totalWorkedMinutes: records.reduce(
        (sum, record) => sum + record.workedMinutes,
        0,
      ),
      totalOvertimeMinutes: records.reduce(
        (sum, record) => sum + record.overtimeMinutes,
        0,
      ),
    };
  }

  async exportAttendanceSummaryCsv(query: AttendanceReportQueryDto) {
    const records = await this.prisma.attendanceRecord.findMany({
      where: this.buildAttendanceWhere(query),
      include: {
        employee: {
          include: {
            currentDepartment: true,
          },
        },
      },
      orderBy: [{ workDate: "asc" }, { employee: { fullName: "asc" } }],
    });

    return this.buildCsv([
      [
        "workDate",
        "employeeCode",
        "fullName",
        "department",
        "attendanceStatus",
        "workedMinutes",
        "lateMinutes",
        "earlyLeaveMinutes",
        "overtimeMinutes",
      ],
      ...records.map((record) => [
        record.workDate.toISOString().slice(0, 10),
        record.employee.employeeCode,
        record.employee.fullName,
        record.employee.currentDepartment.name,
        record.attendanceStatus,
        record.workedMinutes,
        record.lateMinutes,
        record.earlyLeaveMinutes,
        record.overtimeMinutes,
      ]),
    ]);
  }

  async getLeaveSummary(query: LeaveReportQueryDto) {
    const requests = await this.prisma.leaveRequest.findMany({
      where: this.buildLeaveWhere(query),
      include: {
        leaveType: true,
      },
    });

    return {
      filters: query,
      year: query.year,
      month: query.month,
      totalRequests: requests.length,
      approvedCount: requests.filter(
        (request) => request.status === ApprovalStatus.APPROVED,
      ).length,
      pendingCount: requests.filter(
        (request) => request.status === ApprovalStatus.PENDING,
      ).length,
      rejectedCount: requests.filter(
        (request) => request.status === ApprovalStatus.REJECTED,
      ).length,
      byLeaveType: Object.values(
        requests.reduce<Record<string, { code: string; name: string; days: number }>>(
          (acc, request) => {
            const key = request.leaveType.code;
            const current = acc[key] ?? {
              code: request.leaveType.code,
              name: request.leaveType.name,
              days: 0,
            };
            current.days += Number(request.requestedDays);
            acc[key] = current;
            return acc;
          },
          {},
        ),
      ),
    };
  }

  async exportLeaveSummaryCsv(query: LeaveReportQueryDto) {
    const requests = await this.prisma.leaveRequest.findMany({
      where: this.buildLeaveWhere(query),
      include: {
        employee: {
          include: {
            currentDepartment: true,
          },
        },
        leaveType: true,
      },
      orderBy: [{ fromDate: "asc" }, { employee: { fullName: "asc" } }],
    });

    return this.buildCsv([
      [
        "fromDate",
        "toDate",
        "employeeCode",
        "fullName",
        "department",
        "leaveType",
        "requestedDays",
        "status",
        "reason",
      ],
      ...requests.map((request) => [
        request.fromDate.toISOString().slice(0, 10),
        request.toDate.toISOString().slice(0, 10),
        request.employee.employeeCode,
        request.employee.fullName,
        request.employee.currentDepartment.name,
        request.leaveType.name,
        Number(request.requestedDays),
        request.status,
        request.reason,
      ]),
    ]);
  }

  async getPayrollSummary(query: PayrollReportQueryDto) {
    const periods = await this.prisma.payrollPeriod.findMany({
      where: this.buildPayrollPeriodWhere(query),
      include: {
        payslips: {
          where: {
            ...(query.payslipStatus ? { status: query.payslipStatus } : {}),
            ...(query.departmentId
              ? { employee: { currentDepartmentId: query.departmentId } }
              : {}),
          },
        },
      },
    });

    const payslips = periods.flatMap((period) => period.payslips);

    return {
      filters: query,
      year: query.year,
      month: query.month,
      totalPeriods: periods.length,
      publishedPeriods: periods.filter(
        (period) => period.status === PayrollPeriodStatus.PUBLISHED,
      ).length,
      totalPayslips: payslips.length,
      totalGrossIncome: payslips.reduce(
        (sum, payslip) => sum + Number(payslip.grossIncome),
        0,
      ),
      totalNetIncome: payslips.reduce(
        (sum, payslip) => sum + Number(payslip.netIncome),
        0,
      ),
      totalTaxDeduction: payslips.reduce(
        (sum, payslip) => sum + Number(payslip.taxDeductionTotal),
        0,
      ),
      totalInsuranceDeduction: payslips.reduce(
        (sum, payslip) => sum + Number(payslip.insuranceDeductionTotal),
        0,
      ),
    };
  }

  async exportPayrollSummaryCsv(query: PayrollReportQueryDto) {
    const payslips = await this.prisma.payslip.findMany({
      where: this.buildPayslipWhere(query),
      include: {
        employee: {
          include: {
            currentDepartment: true,
          },
        },
        payrollPeriod: true,
      },
      orderBy: [
        { payrollPeriod: { periodStart: "asc" } },
        { employee: { fullName: "asc" } },
      ],
    });

    return this.buildCsv([
      [
        "period",
        "employeeCode",
        "fullName",
        "department",
        "status",
        "grossIncome",
        "netIncome",
        "insuranceDeduction",
        "taxDeduction",
      ],
      ...payslips.map((payslip) => [
        `${payslip.payrollPeriod.year}-${String(payslip.payrollPeriod.month).padStart(2, "0")}`,
        payslip.employee.employeeCode,
        payslip.employee.fullName,
        payslip.employee.currentDepartment.name,
        payslip.status,
        Number(payslip.grossIncome),
        Number(payslip.netIncome),
        Number(payslip.insuranceDeductionTotal),
        Number(payslip.taxDeductionTotal),
      ]),
    ]);
  }
}
