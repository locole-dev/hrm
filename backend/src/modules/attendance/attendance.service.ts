import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ApprovalStatus,
  AttendanceEventType,
  AttendanceStatus,
  AuditAction,
  NotificationType,
  Prisma,
} from "@prisma/client";

import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AttendanceActionDto } from "./dto/attendance-action.dto";
import { CreateOvertimeRequestDto } from "./dto/create-overtime-request.dto";
import { OvertimeDecisionDto } from "./dto/overtime-decision.dto";

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findRecords(query: PaginationQueryDto, user: AuthenticatedUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = await this.buildAttendanceScope(user, query.search);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.attendanceRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { workDate: "desc" },
        include: {
          employee: true,
          shift: true,
          overtimeRequest: true,
        },
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findPendingOvertime(user: AuthenticatedUser) {
    const where = await this.buildOvertimeScope(user, ApprovalStatus.PENDING);

    return this.prisma.overtimeRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        employee: true,
      },
    });
  }

  createOvertimeRequest(
    payload: CreateOvertimeRequestDto,
    user: AuthenticatedUser,
  ) {
    this.ensureSelfOrPrivileged(payload.employeeId, user);

    return this.prisma.overtimeRequest.create({
      data: {
        employeeId: payload.employeeId,
        workDate: new Date(payload.workDate),
        startAt: new Date(payload.startAt),
        endAt: new Date(payload.endAt),
        totalMinutes: payload.totalMinutes,
        overtimeDayType: payload.overtimeDayType,
        multiplier:
          payload.overtimeDayType === "WEEKDAY"
            ? 1.5
            : payload.overtimeDayType === "WEEKEND"
              ? 2
              : 3,
        requestedNote: payload.requestedNote,
      },
    });
  }

  async findMyAttendanceDashboard(user: AuthenticatedUser) {
    if (!user.employeeId) {
      throw new ForbiddenException("Employee context is required");
    }

    const [records, overtimeRequests] = await this.prisma.$transaction([
      this.prisma.attendanceRecord.findMany({
        where: { employeeId: user.employeeId },
        include: {
          shift: true,
          overtimeRequest: true,
        },
        orderBy: { workDate: "desc" },
        take: 31,
      }),
      this.prisma.overtimeRequest.findMany({
        where: { employeeId: user.employeeId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return {
      records,
      overtimeRequests,
    };
  }

  async getMonthlySummary(
    year: number,
    month: number,
    user: AuthenticatedUser,
  ) {
    if (!user.employeeId) {
      throw new ForbiddenException("Employee context is required");
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        employeeId: user.employeeId,
        workDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { workDate: "asc" },
    });

    return {
      year,
      month,
      totalDays: records.length,
      presentDays: records.filter(
        (record) =>
          record.attendanceStatus === AttendanceStatus.PRESENT ||
          record.attendanceStatus === AttendanceStatus.LATE ||
          record.attendanceStatus === AttendanceStatus.EARLY_LEAVE,
      ).length,
      absentDays: records.filter(
        (record) => record.attendanceStatus === AttendanceStatus.ABSENT,
      ).length,
      lateCount: records.filter((record) => record.lateMinutes > 0).length,
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

  async getGlobalSummary(year: number, month: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));

    const [totalEmployees, records, pendingOT] = await this.prisma.$transaction([
      this.prisma.employee.count({ where: { employmentStatus: "ACTIVE" } }),
      this.prisma.attendanceRecord.findMany({
        where: { workDate: { gte: start, lte: end } },
      }),
      this.prisma.overtimeRequest.count({
        where: { status: ApprovalStatus.PENDING },
      }),
    ]);

    const lateCount = records.filter((r) => r.lateMinutes > 0).length;
    const totalOTMinutes = records.reduce((sum, r) => sum + r.overtimeMinutes, 0);
    const totalCheckInsWithTime = records.filter((r) => r.checkInAt);
    const avgCheckInMinutes =
      totalCheckInsWithTime.length > 0
        ? totalCheckInsWithTime.reduce((sum, r) => {
            if (!r.checkInAt) {
              return sum;
            }

            return sum + this.getMinuteOfDay(r.checkInAt);
          }, 0) / totalCheckInsWithTime.length
        : 522; // Default 08:42 AM

    const missingLogs = records.filter(
      (r) =>
        r.attendanceStatus === AttendanceStatus.PRESENT &&
        (!r.checkInAt || !r.checkOutAt),
    ).length;

    return {
      activeStaff: totalEmployees,
      avgCheckIn: this.formatMinuteToTime(avgCheckInMinutes),
      totalOvertimeHours: Math.round(totalOTMinutes / 60),
      latenessRate:
        records.length > 0
          ? parseFloat(((lateCount / records.length) * 100).toFixed(1))
          : 0,
      missingLogsCount: missingLogs + pendingOT, // Combine missing logs and pending adjustments
    };
  }

  private formatMinuteToTime(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  async getManagerApprovalDashboard(user: AuthenticatedUser) {
    if (!user.employeeId) {
      throw new ForbiddenException("Manager context is required");
    }

    const [pendingOvertime, teamAttendance] = await this.prisma.$transaction([
      this.prisma.overtimeRequest.findMany({
        where: {
          status: ApprovalStatus.PENDING,
          employee: {
            currentManagerEmployeeId: user.employeeId,
          },
        },
        include: {
          employee: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      this.prisma.attendanceRecord.findMany({
        where: {
          employee: {
            currentManagerEmployeeId: user.employeeId,
          },
        },
        include: {
          employee: true,
        },
        orderBy: { workDate: "desc" },
        take: 50,
      }),
    ]);

    return {
      pendingOvertime,
      teamAttendance,
    };
  }

  async checkIn(user: AuthenticatedUser, payload: AttendanceActionDto) {
    if (!user.employeeId) {
      throw new ForbiddenException("Employee context is required");
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: user.employeeId },
      include: {
        defaultShift: true,
      },
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    const now = new Date();
    const workDate = this.toWorkDate(now);
    const shift = employee.defaultShift;

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: {
        employeeId_workDate: {
          employeeId: user.employeeId,
          workDate,
        },
      },
    });

    if (existing?.checkInAt) {
      throw new BadRequestException("Already checked in today");
    }

    const lateMinutes = shift
      ? Math.max(0, this.getMinuteOfDay(now) - shift.lateThresholdMinute)
      : 0;

    const record = existing
      ? await this.prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: {
            shiftId: existing.shiftId ?? shift?.id,
            checkInAt: now,
            lateMinutes,
            attendanceStatus:
              lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
            note: payload.note ?? existing.note,
            events: {
              create: {
                eventType: AttendanceEventType.CHECK_IN,
                occurredAt: now,
                note: payload.note,
                source: "employee-self-service",
              },
            },
          },
          include: {
            shift: true,
            events: true,
          },
        })
      : await this.prisma.attendanceRecord.create({
          data: {
            employeeId: user.employeeId,
            shiftId: shift?.id,
            workDate,
            checkInAt: now,
            lateMinutes,
            attendanceStatus:
              lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
            note: payload.note,
            events: {
              create: {
                eventType: AttendanceEventType.CHECK_IN,
                occurredAt: now,
                note: payload.note,
                source: "employee-self-service",
              },
            },
          },
          include: {
            shift: true,
            events: true,
          },
        });

    await this.auditService.log({
      actorUserId: user.userId,
      action: AuditAction.UPDATE,
      entityType: "AttendanceRecord",
      entityId: record.id,
      entityLabel: `${employee.fullName}:${record.workDate.toISOString()}`,
      metadata: {
        action: "check_in",
        lateMinutes: record.lateMinutes,
      },
    });

    return record;
  }

  async checkOut(user: AuthenticatedUser, payload: AttendanceActionDto) {
    if (!user.employeeId) {
      throw new ForbiddenException("Employee context is required");
    }

    const now = new Date();
    const workDate = this.toWorkDate(now);

    const record = await this.prisma.attendanceRecord.findUnique({
      where: {
        employeeId_workDate: {
          employeeId: user.employeeId,
          workDate,
        },
      },
      include: {
        employee: true,
        shift: true,
      },
    });

    if (!record || !record.checkInAt) {
      throw new BadRequestException("No check-in found for today");
    }

    if (record.checkOutAt) {
      throw new BadRequestException("Already checked out today");
    }

    const workedMinutes = Math.max(
      0,
      Math.floor((now.getTime() - record.checkInAt.getTime()) / 60000),
    );
    const earlyLeaveMinutes = record.shift
      ? Math.max(0, record.shift.earlyLeaveThresholdMinute - this.getMinuteOfDay(now))
      : 0;
    const overtimeMinutes = record.shift
      ? Math.max(0, this.getMinuteOfDay(now) - record.shift.overtimeStartMinute)
      : 0;

    const attendanceStatus =
      earlyLeaveMinutes > 0
        ? AttendanceStatus.EARLY_LEAVE
        : record.lateMinutes > 0
          ? AttendanceStatus.LATE
          : AttendanceStatus.PRESENT;

    const updated = await this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkOutAt: now,
        workedMinutes,
        earlyLeaveMinutes,
        overtimeMinutes,
        attendanceStatus,
        note: payload.note ?? record.note,
        events: {
          create: {
            eventType: AttendanceEventType.CHECK_OUT,
            occurredAt: now,
            note: payload.note,
            source: "employee-self-service",
          },
        },
      },
      include: {
        shift: true,
        events: true,
      },
    });

    await this.auditService.log({
      actorUserId: user.userId,
      action: AuditAction.UPDATE,
      entityType: "AttendanceRecord",
      entityId: updated.id,
      entityLabel: `${record.employee.fullName}:${updated.workDate.toISOString()}`,
      metadata: {
        action: "check_out",
        workedMinutes: updated.workedMinutes,
        overtimeMinutes: updated.overtimeMinutes,
      },
    });

    return updated;
  }

  async decideOvertime(
    overtimeRequestId: string,
    payload: OvertimeDecisionDto,
    user: AuthenticatedUser,
  ) {
    const overtimeRequest = await this.prisma.overtimeRequest.findUnique({
      where: { id: overtimeRequestId },
      include: {
        employee: true,
      },
    });

    if (!overtimeRequest) {
      throw new NotFoundException("Overtime request not found");
    }

    if (
      !this.hasPrivilegedRole(user) &&
      overtimeRequest.employee.currentManagerEmployeeId !== user.employeeId
    ) {
      throw new ForbiddenException("You cannot approve this overtime request");
    }

    const updated = await this.prisma.overtimeRequest.update({
      where: { id: overtimeRequestId },
      data: {
        status:
          payload.status === "APPROVED"
            ? ApprovalStatus.APPROVED
            : ApprovalStatus.REJECTED,
        approvedMinutes:
          payload.status === "APPROVED"
            ? payload.approvedMinutes ?? overtimeRequest.totalMinutes
            : null,
        approvedByUserId: user.userId,
        approvedAt: new Date(),
        decisionNote: payload.note,
      },
    });

    await this.auditService.log({
      actorUserId: user.userId,
      action:
        payload.status === "APPROVED"
          ? AuditAction.APPROVE
          : AuditAction.REJECT,
      entityType: "OvertimeRequest",
      entityId: overtimeRequestId,
      entityLabel: overtimeRequest.employee.fullName,
      metadata: {
        approvedMinutes: updated.approvedMinutes,
        decision: payload.status,
        note: payload.note,
      },
    });

    const employeeUser = await this.prisma.user.findFirst({
      where: { employeeId: overtimeRequest.employeeId },
    });

    if (employeeUser) {
      await this.notificationsService.create({
        userId: employeeUser.id,
        type: NotificationType.SYSTEM,
        title:
          payload.status === "APPROVED"
            ? "Overtime approved"
            : "Overtime rejected",
        body:
          payload.status === "APPROVED"
            ? "Your overtime request has been approved"
            : "Your overtime request has been rejected",
        data: {
          overtimeRequestId,
          decision: payload.status,
        },
      });
    }

    return updated;
  }

  private async buildAttendanceScope(
    user: AuthenticatedUser,
    search?: string,
  ): Promise<Prisma.AttendanceRecordWhereInput> {
    const searchFilter: Prisma.AttendanceRecordWhereInput | undefined = search
      ? {
          OR: [
            {
              employee: {
                fullName: { contains: search, mode: "insensitive" },
              },
            },
            {
              employee: {
                employeeCode: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }
      : undefined;

    if (this.hasPrivilegedRole(user)) {
      return searchFilter ?? {};
    }

    if (user.roles.includes("MANAGER") && user.employeeId) {
      return {
        AND: [
          searchFilter ?? {},
          {
            employee: {
              currentManagerEmployeeId: user.employeeId,
            },
          },
        ],
      };
    }

    return {
      AND: [
        searchFilter ?? {},
        { employeeId: user.employeeId ?? "__no_employee__" },
      ],
    };
  }

  private async buildOvertimeScope(
    user: AuthenticatedUser,
    status?: ApprovalStatus,
  ): Promise<Prisma.OvertimeRequestWhereInput> {
    const baseWhere: Prisma.OvertimeRequestWhereInput = status ? { status } : {};

    if (this.hasPrivilegedRole(user)) {
      return baseWhere;
    }

    if (user.roles.includes("MANAGER") && user.employeeId) {
      return {
        AND: [
          baseWhere,
          {
            employee: {
              currentManagerEmployeeId: user.employeeId,
            },
          },
        ],
      };
    }

    return {
      AND: [
        baseWhere,
        { employeeId: user.employeeId ?? "__no_employee__" },
      ],
    };
  }

  private ensureSelfOrPrivileged(employeeId: string, user: AuthenticatedUser) {
    if (this.hasPrivilegedRole(user)) {
      return;
    }

    if (user.employeeId !== employeeId) {
      throw new ForbiddenException(
        "You can only create overtime requests for yourself",
      );
    }
  }

  private hasPrivilegedRole(user: AuthenticatedUser) {
    return ["ADMIN", "HR_MANAGER", "HR"].some((role) =>
      user.roles.includes(role),
    );
  }

  private getMinuteOfDay(date: Date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  private toWorkDate(date: Date) {
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
  }
}
