import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ApprovalStatus } from "@prisma/client";

import { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ManagerService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureManagerContext(user: AuthenticatedUser) {
    if (!user.employeeId && !user.roles.includes("ADMIN") && !user.roles.includes("HR_MANAGER")) {
      throw new ForbiddenException("Manager context is required");
    }
  }

  private buildTeamScope(user: AuthenticatedUser) {
    if (user.roles.includes("ADMIN") || user.roles.includes("HR_MANAGER")) {
      return {};
    }

    if (!user.employeeId) {
      throw new ForbiddenException("Manager context is required");
    }

    return { currentManagerEmployeeId: user.employeeId };
  }

  async getMyTeam(user: AuthenticatedUser) {
    this.ensureManagerContext(user);

    return this.prisma.employee.findMany({
      where: this.buildTeamScope(user),
      include: {
        currentDepartment: true,
        currentPosition: true,
      },
      orderBy: { fullName: "asc" },
    });
  }

  async getTeamAttendanceSnapshot(
    user: AuthenticatedUser,
    year: number,
    month: number,
  ) {
    this.ensureManagerContext(user);

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    const teamScope = this.buildTeamScope(user);

    const [teamMembers, attendanceRecords] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where: teamScope,
        select: { id: true, fullName: true, employeeCode: true },
      }),
      this.prisma.attendanceRecord.findMany({
        where: {
          employee: teamScope,
          workDate: { gte: start, lte: end },
        },
      }),
    ]);

    return {
      teamSize: teamMembers.length,
      items: teamMembers.map((member) => {
        const records = attendanceRecords.filter(
          (record) => record.employeeId === member.id,
        );

        return {
          employeeId: member.id,
          employeeCode: member.employeeCode,
          fullName: member.fullName,
          totalWorkedMinutes: records.reduce(
            (sum, record) => sum + record.workedMinutes,
            0,
          ),
          totalOvertimeMinutes: records.reduce(
            (sum, record) => sum + record.overtimeMinutes,
            0,
          ),
          lateCount: records.filter((record) => record.lateMinutes > 0).length,
          earlyLeaveCount: records.filter((record) => record.earlyLeaveMinutes > 0)
            .length,
        };
      }),
    };
  }

  async getTeamApprovalQueues(user: AuthenticatedUser) {
    this.ensureManagerContext(user);
    const teamScope = this.buildTeamScope(user);

    const [leaveRequests, overtimeRequests] = await this.prisma.$transaction([
      this.prisma.leaveRequest.findMany({
        where: {
          status: ApprovalStatus.PENDING,
          employee: teamScope,
        },
        include: {
          employee: true,
          leaveType: true,
        },
        orderBy: { submittedAt: "desc" },
        take: 20,
      }),
      this.prisma.overtimeRequest.findMany({
        where: {
          status: ApprovalStatus.PENDING,
          employee: teamScope,
        },
        include: {
          employee: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return { leaveRequests, overtimeRequests };
  }

  async getTeamMemberDetail(user: AuthenticatedUser, employeeId: string) {
    this.ensureManagerContext(user);

    const teamScope = this.buildTeamScope(user);
    const recentAttendanceStart = new Date();
    recentAttendanceStart.setUTCDate(recentAttendanceStart.getUTCDate() - 30);

    const employee = await this.prisma.employee.findFirst({
      where: {
        id: employeeId,
        ...teamScope,
      },
      include: {
        currentDepartment: true,
        currentPosition: true,
        manager: true,
        defaultShift: true,
        contracts: {
          where: { isActive: true },
          orderBy: { startDate: "desc" },
          take: 1,
        },
        leaveBalances: {
          include: {
            leaveType: true,
          },
          orderBy: {
            year: "desc",
          },
        },
        leaveRequests: {
          include: {
            leaveType: true,
          },
          orderBy: {
            submittedAt: "desc",
          },
          take: 5,
        },
        overtimeRequests: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        attendanceRecords: {
          where: {
            workDate: { gte: recentAttendanceStart },
          },
          orderBy: {
            workDate: "desc",
          },
          take: 10,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException("Team member not found");
    }

    return {
      profile: employee,
      summary: {
        recentAttendanceCount: employee.attendanceRecords.length,
        recentLateCount: employee.attendanceRecords.filter(
          (record) => record.lateMinutes > 0,
        ).length,
        recentEarlyLeaveCount: employee.attendanceRecords.filter(
          (record) => record.earlyLeaveMinutes > 0,
        ).length,
        recentOvertimeRequestCount: employee.overtimeRequests.length,
        pendingLeaveRequestCount: employee.leaveRequests.filter(
          (request) => request.status === ApprovalStatus.PENDING,
        ).length,
      },
    };
  }
}
