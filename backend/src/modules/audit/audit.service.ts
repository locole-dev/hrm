import { Injectable } from "@nestjs/common";
import { AuditAction } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { PaginationQueryDto } from "src/common/dto/pagination-query.dto";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(input: {
    actorUserId?: string | null;
    action: AuditAction;
    entityType: string;
    entityId: string;
    entityLabel?: string;
    changes?: unknown;
    metadata?: unknown;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        entityLabel: input.entityLabel,
        changes: input.changes as never,
        metadata: input.metadata as never,
      },
    });
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          actorUser: {
            select: {
               id: true,
               email: true,
               employee: {
                 select: {
                   fullName: true
                 }
               }
            }
          }
        }
      }),
      this.prisma.auditLog.count(),
    ]);

    return { items, total, page, limit };
  }
}
