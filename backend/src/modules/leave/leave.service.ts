import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ApprovalStatus, AuditAction, NotificationType, Prisma } from "@prisma/client";

import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CancelLeaveRequestDto } from "./dto/cancel-leave-request.dto";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";
import { LeaveDecisionDto } from "./dto/leave-decision.dto";

@Injectable()
export class LeaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findTypes() {
    return this.prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async findRequests(query: PaginationQueryDto, user: AuthenticatedUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = await this.buildLeaveScope(user, query.search);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.leaveRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: "desc" },
        include: {
          employee: true,
          leaveType: true,
          approvals: true,
        },
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  findBalances(employeeId: string, user: AuthenticatedUser) {
    this.ensureSelfOrPrivileged(employeeId, user);

    return this.prisma.leaveBalance.findMany({
      where: { employeeId },
      include: {
        leaveType: true,
      },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    });
  }

  async createRequest(payload: CreateLeaveRequestDto, user: AuthenticatedUser) {
    this.ensureSelfOrPrivileged(payload.employeeId, user);

    const employee = await this.prisma.employee.findUnique({
      where: { id: payload.employeeId },
      include: {
        manager: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    const leaveRequest = await this.prisma.leaveRequest.create({
      data: {
        employeeId: payload.employeeId,
        leaveTypeId: payload.leaveTypeId,
        fromDate: new Date(payload.fromDate),
        toDate: new Date(payload.toDate),
        requestedDays: payload.requestedDays,
        reason: payload.reason,
        attachmentUrl: payload.attachmentUrl,
        approvals: employee.manager?.user
          ? {
              create: [
                {
                  approverUserId: employee.manager.user.id,
                  stepOrder: 1,
                  status: ApprovalStatus.PENDING,
                },
              ],
            }
          : undefined,
      },
      include: {
        approvals: true,
        employee: true,
        leaveType: true,
      },
    });

    await this.auditService.log({
      actorUserId: user.userId,
      action: AuditAction.CREATE,
      entityType: "LeaveRequest",
      entityId: leaveRequest.id,
      entityLabel: employee.fullName,
      metadata: {
        autoApprovalStepCreated: leaveRequest.approvals.length > 0,
        employeeId: payload.employeeId,
      },
    });

    if (employee.manager?.user) {
      await this.notificationsService.create({
        userId: employee.manager.user.id,
        type: NotificationType.LEAVE_SUBMITTED,
        title: "New leave request",
        body: `${employee.fullName} submitted a leave request`,
        data: {
          leaveRequestId: leaveRequest.id,
          employeeId: employee.id,
        },
      });
    }

    return leaveRequest;
  }

  async findMyLeaveDashboard(user: AuthenticatedUser) {
    if (!user.employeeId) {
      throw new ForbiddenException("Employee context is required");
    }

    const [balances, requests] = await this.prisma.$transaction([
      this.prisma.leaveBalance.findMany({
        where: { employeeId: user.employeeId },
        include: { leaveType: true },
        orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      }),
      this.prisma.leaveRequest.findMany({
        where: { employeeId: user.employeeId },
        include: {
          leaveType: true,
          approvals: true,
        },
        orderBy: { submittedAt: "desc" },
        take: 20,
      }),
    ]);

    return {
      balances,
      requests,
    };
  }

  async getManagerApprovalDashboard(user: AuthenticatedUser) {
    if (!user.employeeId) {
      throw new ForbiddenException("Manager context is required");
    }

    return this.prisma.leaveRequest.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        employee: {
          currentManagerEmployeeId: user.employeeId,
        },
      },
      include: {
        employee: true,
        leaveType: true,
        approvals: true,
      },
      orderBy: { submittedAt: "desc" },
      take: 20,
    });
  }

  async decideRequest(
    requestId: string,
    payload: LeaveDecisionDto,
    user: AuthenticatedUser,
  ) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: true,
        approvals: {
          orderBy: { stepOrder: "asc" },
        },
      },
    });

    if (!request) {
      throw new NotFoundException("Leave request not found");
    }

    const pendingApproval = request.approvals.find(
      (approval) =>
        approval.status === ApprovalStatus.PENDING &&
        approval.approverUserId === user.userId,
    );

    if (!pendingApproval && !this.hasPrivilegedRole(user)) {
      throw new ForbiddenException("You cannot decide this request");
    }

    const nextStatus =
      payload.status === "APPROVED"
        ? ApprovalStatus.APPROVED
        : ApprovalStatus.REJECTED;

    await this.prisma.$transaction(async (tx) => {
      if (pendingApproval) {
        await tx.leaveApproval.update({
          where: { id: pendingApproval.id },
          data: {
            status: nextStatus,
            note: payload.note,
            decidedAt: new Date(),
          },
        });
      }

      await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: nextStatus,
          decisionNote: payload.note,
          decidedAt: new Date(),
        },
      });
    });

    await this.auditService.log({
      actorUserId: user.userId,
      action:
        nextStatus === ApprovalStatus.APPROVED
          ? AuditAction.APPROVE
          : AuditAction.REJECT,
      entityType: "LeaveRequest",
      entityId: requestId,
      entityLabel: request.employee.fullName,
      metadata: {
        decision: nextStatus,
        note: payload.note,
      },
    });

    const employeeUser = await this.prisma.user.findFirst({
      where: { employeeId: request.employeeId },
    });

    if (employeeUser) {
      await this.notificationsService.create({
        userId: employeeUser.id,
        type:
          nextStatus === ApprovalStatus.APPROVED
            ? NotificationType.LEAVE_APPROVED
            : NotificationType.LEAVE_REJECTED,
        title:
          nextStatus === ApprovalStatus.APPROVED
            ? "Leave approved"
            : "Leave rejected",
        body:
          nextStatus === ApprovalStatus.APPROVED
            ? "Your leave request has been approved"
            : "Your leave request has been rejected",
        data: {
          leaveRequestId: requestId,
          decision: nextStatus,
        },
      });
    }

    return this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: true,
        leaveType: true,
        approvals: true,
      },
    });
  }

  async cancelRequest(
    requestId: string,
    payload: CancelLeaveRequestDto,
    user: AuthenticatedUser,
  ) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: true,
        approvals: true,
      },
    });

    if (!request) {
      throw new NotFoundException("Leave request not found");
    }

    this.ensureSelfOrPrivileged(request.employeeId, user);

    if (request.status === ApprovalStatus.CANCELLED) {
      throw new BadRequestException("Leave request is already cancelled");
    }

    if (request.status === ApprovalStatus.REJECTED) {
      throw new BadRequestException("Rejected leave request cannot be cancelled");
    }

    const today = new Date();
    const startDate = new Date(request.fromDate);

    if (
      request.status === ApprovalStatus.APPROVED &&
      startDate.getTime() <= today.getTime()
    ) {
      throw new BadRequestException(
        "Approved leave can only be cancelled before the start date",
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.leaveApproval.updateMany({
        where: {
          leaveRequestId: requestId,
          status: ApprovalStatus.PENDING,
        },
        data: {
          status: ApprovalStatus.CANCELLED,
          note: payload.note,
          decidedAt: new Date(),
        },
      });

      return tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: ApprovalStatus.CANCELLED,
          cancelledAt: new Date(),
          decisionNote: payload.note,
        },
        include: {
          employee: true,
          leaveType: true,
          approvals: true,
        },
      });
    });

    await this.auditService.log({
      actorUserId: user.userId,
      action: AuditAction.UPDATE,
      entityType: "LeaveRequest",
      entityId: requestId,
      entityLabel: request.employee.fullName,
      metadata: {
        action: "cancel",
        note: payload.note,
      },
    });

    return updated;
  }

  private async buildLeaveScope(user: AuthenticatedUser, search?: string) {
    const searchFilter: Prisma.LeaveRequestWhereInput | undefined = search
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
        {
          employeeId: user.employeeId ?? "__no_employee__",
        },
      ],
    };
  }

  private ensureSelfOrPrivileged(employeeId: string, user: AuthenticatedUser) {
    if (this.hasPrivilegedRole(user)) {
      return;
    }

    if (user.employeeId !== employeeId) {
      throw new ForbiddenException("You can only access your own leave data");
    }
  }

  private hasPrivilegedRole(user: AuthenticatedUser) {
    return ["ADMIN", "HR_MANAGER", "HR"].some((role) =>
      user.roles.includes(role),
    );
  }
}
