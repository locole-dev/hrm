import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationStatus, NotificationType } from "@prisma/client";

import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: unknown;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data as never,
      },
    });
  }

  async findMyNotifications(user: AuthenticatedUser, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { userId: user.userId },
      }),
    ]);

    return { items, total, page, limit };
  }

  async getUnreadCount(user: AuthenticatedUser) {
    const unreadCount = await this.prisma.notification.count({
      where: {
        userId: user.userId,
        status: NotificationStatus.UNREAD,
      },
    });

    return { unreadCount };
  }

  async markOneRead(user: AuthenticatedUser, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.userId,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    if (!result.count) {
      throw new NotFoundException("Notification not found");
    }

    return this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.userId,
      },
    });
  }

  async markManyRead(user: AuthenticatedUser, notificationIds?: string[]) {
    const where = notificationIds?.length
      ? {
          userId: user.userId,
          id: { in: notificationIds },
          status: NotificationStatus.UNREAD,
        }
      : {
          userId: user.userId,
          status: NotificationStatus.UNREAD,
        };

    const result = await this.prisma.notification.updateMany({
      where,
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return {
      updatedCount: result.count,
    };
  }

  markAllRead(user: AuthenticatedUser) {
    return this.markManyRead(user);
  }
}
