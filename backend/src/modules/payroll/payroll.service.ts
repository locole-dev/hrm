import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ApprovalStatus,
  AuditAction,
  AttendanceStatus,
  NotificationType,
  PayslipStatus,
  PayslipItemType,
  PayrollPeriodStatus,
  Prisma,
} from "@prisma/client";

import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreatePayrollPeriodDto } from "./dto/create-payroll-period.dto";
import { RunPayrollDraftDto } from "./dto/run-payroll-draft.dto";
import { UpsertPayrollRulesDto } from "./dto/upsert-payroll-rules.dto";

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findPeriods(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payrollPeriod.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ year: "desc" }, { month: "desc" }],
        include: {
          payslips: true,
          insuranceRuleVersion: true,
          taxRuleVersion: true,
        },
      }),
      this.prisma.payrollPeriod.count(),
    ]);

    return { items, total, page, limit };
  }

  async getConfigContext() {
    const company = await this.prisma.company.findFirst({
      orderBy: { createdAt: "asc" },
      include: {
        branches: {
          orderBy: [{ isActive: "desc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            isActive: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException("Company context not found");
    }

    const [latestPayrollPeriod, insuranceYears, taxYears] =
      await this.prisma.$transaction([
        this.prisma.payrollPeriod.findFirst({
          where: { companyId: company.id },
          orderBy: [{ year: "desc" }, { month: "desc" }],
          select: {
            id: true,
            companyId: true,
            branchId: true,
            year: true,
            month: true,
            status: true,
          },
        }),
        this.prisma.insuranceRuleVersion.findMany({
          where: { companyId: company.id },
          distinct: ["year"],
          select: { year: true },
          orderBy: { year: "desc" },
        }),
        this.prisma.taxRuleVersion.findMany({
          where: { companyId: company.id },
          distinct: ["year"],
          select: { year: true },
          orderBy: { year: "desc" },
        }),
      ]);

    const availableRuleYears = Array.from(
      new Set([
        ...insuranceYears.map((item) => item.year),
        ...taxYears.map((item) => item.year),
        ...(latestPayrollPeriod ? [latestPayrollPeriod.year] : []),
      ]),
    ).sort((left, right) => right - left);

    return {
      company: {
        id: company.id,
        name: company.name,
        code: company.code,
      },
      branches: company.branches,
      defaultBranchId:
        latestPayrollPeriod?.branchId ?? company.branches[0]?.id ?? null,
      latestPayrollPeriod,
      availableRuleYears,
    };
  }

  async getRules(companyId: string, year: number) {
    const [insuranceRule, taxRule] = await this.prisma.$transaction([
      this.prisma.insuranceRuleVersion.findFirst({
        where: { companyId, year },
        orderBy: [{ isActive: "desc" }, { effectiveFrom: "desc" }],
      }),
      this.prisma.taxRuleVersion.findFirst({
        where: { companyId, year },
        orderBy: [{ isActive: "desc" }, { effectiveFrom: "desc" }],
        include: {
          brackets: {
            orderBy: { bracketOrder: "asc" },
          },
        },
      }),
    ]);

    return {
      companyId,
      year,
      insuranceRule,
      taxRule,
    };
  }

  findPayslips(periodId: string) {
    return this.prisma.payslip.findMany({
      where: { payrollPeriodId: periodId },
      include: {
        employee: {
          include: {
            currentDepartment: true,
          },
        },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findMyPayslips(user: AuthenticatedUser) {
    if (!user.employeeId) {
      throw new ForbiddenException("Employee context is required");
    }

    return this.prisma.payslip.findMany({
      where: { employeeId: user.employeeId },
      include: {
        payrollPeriod: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
  }

  createPeriod(payload: CreatePayrollPeriodDto) {
    return this.prisma.payrollPeriod.create({
      data: {
        companyId: payload.companyId,
        branchId: payload.branchId,
        year: payload.year,
        month: payload.month,
        periodStart: new Date(payload.periodStart),
        periodEnd: new Date(payload.periodEnd),
      },
    });
  }

  async saveRules(payload: UpsertPayrollRulesDto) {
    const existingInsuranceRule =
      await this.prisma.insuranceRuleVersion.findFirst({
        where: {
          companyId: payload.companyId,
          year: payload.year,
        },
        orderBy: [{ isActive: "desc" }, { effectiveFrom: "desc" }],
      });

    const insuranceRule = existingInsuranceRule
      ? await this.prisma.insuranceRuleVersion.update({
          where: { id: existingInsuranceRule.id },
          data: {
            effectiveFrom: new Date(payload.insuranceRule.effectiveFrom),
            isActive: true,
            employeeBhxhRate: payload.insuranceRule.employeeBhxhRate,
            employeeBhytRate: payload.insuranceRule.employeeBhytRate,
            employeeBhtnRate: payload.insuranceRule.employeeBhtnRate,
            employerBhxhRate: payload.insuranceRule.employerBhxhRate ?? null,
            employerBhytRate: payload.insuranceRule.employerBhytRate ?? null,
            employerBhtnRate: payload.insuranceRule.employerBhtnRate ?? null,
            salaryCap: payload.insuranceRule.salaryCap ?? null,
            notes: payload.insuranceRule.notes,
          },
        })
      : await this.prisma.insuranceRuleVersion.create({
          data: {
            companyId: payload.companyId,
            year: payload.year,
            effectiveFrom: new Date(payload.insuranceRule.effectiveFrom),
            isActive: true,
            employeeBhxhRate: payload.insuranceRule.employeeBhxhRate,
            employeeBhytRate: payload.insuranceRule.employeeBhytRate,
            employeeBhtnRate: payload.insuranceRule.employeeBhtnRate,
            employerBhxhRate: payload.insuranceRule.employerBhxhRate ?? null,
            employerBhytRate: payload.insuranceRule.employerBhytRate ?? null,
            employerBhtnRate: payload.insuranceRule.employerBhtnRate ?? null,
            salaryCap: payload.insuranceRule.salaryCap ?? null,
            notes: payload.insuranceRule.notes,
          },
        });

    const existingTaxRule = await this.prisma.taxRuleVersion.findFirst({
      where: {
        companyId: payload.companyId,
        year: payload.year,
      },
      orderBy: [{ isActive: "desc" }, { effectiveFrom: "desc" }],
    });

    const taxRule = existingTaxRule
      ? await this.prisma.taxRuleVersion.update({
          where: { id: existingTaxRule.id },
          data: {
            effectiveFrom: new Date(payload.taxRule.effectiveFrom),
            isActive: true,
            personalDeduction: payload.taxRule.personalDeduction,
            dependentDeduction: payload.taxRule.dependentDeduction,
            notes: payload.taxRule.notes,
          },
        })
      : await this.prisma.taxRuleVersion.create({
          data: {
            companyId: payload.companyId,
            year: payload.year,
            effectiveFrom: new Date(payload.taxRule.effectiveFrom),
            isActive: true,
            personalDeduction: payload.taxRule.personalDeduction,
            dependentDeduction: payload.taxRule.dependentDeduction,
            notes: payload.taxRule.notes,
          },
        });

    await this.prisma.taxBracket.deleteMany({
      where: { taxRuleVersionId: taxRule.id },
    });

    await this.prisma.taxBracket.createMany({
      data: payload.taxRule.brackets.map((bracket) => ({
        taxRuleVersionId: taxRule.id,
        bracketOrder: bracket.bracketOrder,
        fromAmount: bracket.fromAmount,
        toAmount: bracket.toAmount ?? null,
        rate: bracket.rate,
        quickDeduction: bracket.quickDeduction ?? null,
      })),
    });

    return this.getRules(payload.companyId, payload.year);
  }

  async lockPeriod(periodId: string, user: AuthenticatedUser) {
    this.ensurePayrollLockAccess(user);

    const period = await this.updatePeriodState(periodId, {
      status: PayrollPeriodStatus.LOCKED,
      lockedByUserId: user.userId,
      lockedAt: new Date(),
    });

    await this.auditService.log({
      actorUserId: user.userId,
      action: AuditAction.LOCK,
      entityType: "PayrollPeriod",
      entityId: period.id,
      entityLabel: `${period.year}-${period.month}`,
      metadata: { status: period.status },
    });

    return period;
  }

  async unlockPeriod(periodId: string, user: AuthenticatedUser) {
    this.ensurePayrollLockAccess(user);

    const period = await this.updatePeriodState(periodId, {
      status: PayrollPeriodStatus.DRAFT,
      lockedByUserId: null,
      lockedAt: null,
    });

    await this.auditService.log({
      actorUserId: user.userId,
      action: AuditAction.UNLOCK,
      entityType: "PayrollPeriod",
      entityId: period.id,
      entityLabel: `${period.year}-${period.month}`,
      metadata: { status: period.status },
    });

    return period;
  }

  async publishPeriod(periodId: string, user: AuthenticatedUser) {
    this.ensurePayrollWriteAccess(user);

    const period = await this.updatePeriodState(periodId, {
      status: PayrollPeriodStatus.PUBLISHED,
      publishedByUserId: user.userId,
      publishedAt: new Date(),
    });

    await this.auditService.log({
      actorUserId: user.userId,
      action: AuditAction.UPDATE,
      entityType: "PayrollPeriod",
      entityId: period.id,
      entityLabel: `${period.year}-${period.month}`,
      metadata: { status: period.status, publishedAt: period.publishedAt },
    });

    const payslips = await this.prisma.payslip.findMany({
      where: { payrollPeriodId: period.id },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    await Promise.all(
      payslips
        .filter((payslip) => payslip.employee.user)
        .map((payslip) =>
          this.notificationsService.create({
            userId: payslip.employee.user!.id,
            type: NotificationType.PAYSLIP_PUBLISHED,
            title: "Payslip published",
            body: `Your payslip for ${period.month}/${period.year} is ready`,
            data: {
              payrollPeriodId: period.id,
              payslipId: payslip.id,
            },
          }),
        ),
    );

    return period;
  }

  async runDraft(periodId: string, payload: RunPayrollDraftDto, user: AuthenticatedUser) {
    this.ensurePayrollWriteAccess(user);

    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: {
        insuranceRuleVersion: true,
        taxRuleVersion: {
          include: {
            brackets: {
              orderBy: { bracketOrder: "asc" },
            },
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException("Payroll period not found");
    }

    if (period.status === PayrollPeriodStatus.LOCKED) {
      throw new BadRequestException("Locked payroll period cannot run draft");
    }

    const employees = await this.prisma.employee.findMany({
      where: {
        companyId: period.companyId,
        branchId: period.branchId ?? undefined,
        employmentStatus: {
          in: ["ACTIVE", "PROBATION"],
        },
      },
      include: {
        contracts: {
          where: {
            isActive: true,
          },
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
    });

    const results = [];

    for (const employee of employees) {
      const contract = employee.contracts[0];

      if (!contract) {
        continue;
      }

      const [attendanceRecords, unpaidLeaveRequests, overtimeRequests] =
        await this.prisma.$transaction([
          this.prisma.attendanceRecord.findMany({
            where: {
              employeeId: employee.id,
              workDate: {
                gte: period.periodStart,
                lte: period.periodEnd,
              },
            },
          }),
          this.prisma.leaveRequest.findMany({
            where: {
              employeeId: employee.id,
              status: ApprovalStatus.APPROVED,
              fromDate: { lte: period.periodEnd },
              toDate: { gte: period.periodStart },
              leaveType: {
                isPaid: false,
              },
            },
            include: {
              leaveType: true,
            },
          }),
          this.prisma.overtimeRequest.findMany({
            where: {
              employeeId: employee.id,
              status: ApprovalStatus.APPROVED,
              workDate: {
                gte: period.periodStart,
                lte: period.periodEnd,
              },
            },
          }),
        ]);

      const workingDayBase = 22;
      const dailyRate = Number(contract.baseSalary) / workingDayBase;
      const hourlyRate = dailyRate / 8;
      const absentDays = attendanceRecords.filter(
        (record) => record.attendanceStatus === AttendanceStatus.ABSENT,
      ).length;
      const unpaidLeaveDays = unpaidLeaveRequests.reduce(
        (sum, item) => sum + Number(item.requestedDays),
        0,
      );
      const attendanceDeductionTotal = this.roundCurrency(
        dailyRate * (absentDays + unpaidLeaveDays),
      );
      const overtimePayTotal = this.roundCurrency(
        overtimeRequests.reduce((sum, item) => {
          const approvedMinutes = item.approvedMinutes ?? item.totalMinutes;
          return (
            sum +
            (approvedMinutes / 60) * hourlyRate * Number(item.multiplier)
          );
        }, 0),
      );
      const baseSalary = Number(contract.baseSalary);
      const grossIncome = this.roundCurrency(baseSalary + overtimePayTotal);
      const insuranceDeductionTotal = this.computeInsuranceDeduction(
        baseSalary,
        period.insuranceRuleVersion,
      );
      const preTaxIncome = this.roundCurrency(
        grossIncome - insuranceDeductionTotal - attendanceDeductionTotal,
      );
      const taxDeductionTotal = this.computePersonalIncomeTax(
        preTaxIncome,
        period.taxRuleVersion,
      );
      const netIncome = this.roundCurrency(preTaxIncome - taxDeductionTotal);

      const payslip = await this.prisma.payslip.upsert({
        where: {
          payrollPeriodId_employeeId: {
            payrollPeriodId: period.id,
            employeeId: employee.id,
          },
        },
        update: {
          contractId: contract.id,
          insuranceRuleVersionId: period.insuranceRuleVersionId,
          taxRuleVersionId: period.taxRuleVersionId,
          baseSalary,
          attendanceDeductionTotal,
          overtimePayTotal,
          insuranceDeductionTotal,
          taxDeductionTotal,
          grossIncome,
          preTaxIncome,
          netIncome,
          insuranceRuleSnapshot: period.insuranceRuleVersion ?? Prisma.JsonNull,
          taxRuleSnapshot: period.taxRuleVersion ?? Prisma.JsonNull,
          status: PayslipStatus.GENERATED,
          items: {
            deleteMany: {},
            create: this.buildPayslipItems({
              baseSalary,
              attendanceDeductionTotal,
              overtimePayTotal,
              insuranceDeductionTotal,
              taxDeductionTotal,
            }),
          },
        },
        create: {
          payrollPeriodId: period.id,
          employeeId: employee.id,
          contractId: contract.id,
          insuranceRuleVersionId: period.insuranceRuleVersionId,
          taxRuleVersionId: period.taxRuleVersionId,
          baseSalary,
          attendanceDeductionTotal,
          overtimePayTotal,
          insuranceDeductionTotal,
          taxDeductionTotal,
          grossIncome,
          preTaxIncome,
          netIncome,
          insuranceRuleSnapshot: period.insuranceRuleVersion ?? Prisma.JsonNull,
          taxRuleSnapshot: period.taxRuleVersion ?? Prisma.JsonNull,
          status: PayslipStatus.GENERATED,
          items: {
            create: this.buildPayslipItems({
              baseSalary,
              attendanceDeductionTotal,
              overtimePayTotal,
              insuranceDeductionTotal,
              taxDeductionTotal,
            }),
          },
        },
        include: {
          items: true,
        },
      });

      results.push(payslip);
    }

    await this.prisma.payrollPeriod.update({
      where: { id: period.id },
      data: {
        status: PayrollPeriodStatus.PROCESSING,
      },
    });

    await this.auditService.log({
      actorUserId: user.userId,
      action: AuditAction.UPDATE,
      entityType: "PayrollPeriod",
      entityId: period.id,
      entityLabel: `${period.year}-${period.month}`,
      metadata: {
        action: "run_draft",
        generatedPayslips: results.length,
        note: payload.note,
      },
    });

    return {
      payrollPeriodId: period.id,
      generatedPayslips: results.length,
      payslips: results,
    };
  }

  private async updatePeriodState(
    periodId: string,
    data: {
      status: PayrollPeriodStatus;
      lockedByUserId?: string | null;
      lockedAt?: Date | null;
      publishedByUserId?: string | null;
      publishedAt?: Date | null;
    },
  ) {
    const existing = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });

    if (!existing) {
      throw new NotFoundException("Payroll period not found");
    }

    return this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data,
    });
  }

  private ensurePayrollLockAccess(user: AuthenticatedUser) {
    if (!["ADMIN", "HR_MANAGER"].some((role) => user.roles.includes(role))) {
      throw new ForbiddenException(
        "Only Admin and HR Manager can lock or unlock payroll periods",
      );
    }
  }

  private ensurePayrollWriteAccess(user: AuthenticatedUser) {
    if (
      !["ADMIN", "HR_MANAGER", "PAYROLL"].some((role) =>
        user.roles.includes(role),
      )
    ) {
      throw new ForbiddenException("You cannot publish payroll periods");
    }
  }

  private computeInsuranceDeduction(
    baseSalary: number,
    rule:
      | {
          employeeBhxhRate: Prisma.Decimal;
          employeeBhytRate: Prisma.Decimal;
          employeeBhtnRate: Prisma.Decimal;
          salaryCap: Prisma.Decimal | null;
        }
      | null,
  ) {
    if (!rule) {
      return 0;
    }

    const cappedSalary = rule.salaryCap
      ? Math.min(baseSalary, Number(rule.salaryCap))
      : baseSalary;

    return this.roundCurrency(
      cappedSalary *
        (Number(rule.employeeBhxhRate) +
          Number(rule.employeeBhytRate) +
          Number(rule.employeeBhtnRate)),
    );
  }

  private computePersonalIncomeTax(
    preTaxIncome: number,
    rule:
      | {
          personalDeduction: Prisma.Decimal;
          dependentDeduction: Prisma.Decimal;
          brackets: {
            fromAmount: Prisma.Decimal;
            toAmount: Prisma.Decimal | null;
            rate: Prisma.Decimal;
            quickDeduction: Prisma.Decimal | null;
          }[];
        }
      | null,
  ) {
    if (!rule) {
      return 0;
    }

    const taxableIncome = Math.max(
      0,
      preTaxIncome - Number(rule.personalDeduction),
    );

    const matchedBracket = rule.brackets.find((bracket) => {
      const from = Number(bracket.fromAmount);
      const to = bracket.toAmount ? Number(bracket.toAmount) : Number.POSITIVE_INFINITY;
      return taxableIncome >= from && taxableIncome <= to;
    });

    if (!matchedBracket) {
      return 0;
    }

    return this.roundCurrency(
      taxableIncome * Number(matchedBracket.rate) -
        Number(matchedBracket.quickDeduction ?? 0),
    );
  }

  private buildPayslipItems(input: {
    baseSalary: number;
    attendanceDeductionTotal: number;
    overtimePayTotal: number;
    insuranceDeductionTotal: number;
    taxDeductionTotal: number;
  }) {
    return [
      {
        itemType: PayslipItemType.BASE_SALARY,
        code: "BASE_SALARY",
        label: "Base Salary",
        amount: input.baseSalary,
      },
      {
        itemType: PayslipItemType.ATTENDANCE_DEDUCTION,
        code: "ATTENDANCE_DEDUCTION",
        label: "Attendance Deduction",
        amount: input.attendanceDeductionTotal,
      },
      {
        itemType: PayslipItemType.OVERTIME,
        code: "OVERTIME",
        label: "Approved Overtime",
        amount: input.overtimePayTotal,
      },
      {
        itemType: PayslipItemType.INSURANCE_DEDUCTION,
        code: "INSURANCE",
        label: "Insurance Deduction",
        amount: input.insuranceDeductionTotal,
      },
      {
        itemType: PayslipItemType.TAX_DEDUCTION,
        code: "PIT",
        label: "Personal Income Tax",
        amount: input.taxDeductionTotal,
      },
    ];
  }

  private roundCurrency(value: number) {
    return Math.round(value * 100) / 100;
  }
}
