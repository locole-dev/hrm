import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { CreatePositionDto } from "./dto/create-position.dto";
import { UpdatePositionDto } from "./dto/update-position.dto";

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.position.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            currentEmployees: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { level: "asc" }, { name: "asc" }],
    });
  }

  create(payload: CreatePositionDto) {
    return this.prisma.position.create({
      data: {
        companyId: payload.companyId,
        name: payload.name,
        code: payload.code,
        level: payload.level,
        isActive: payload.isActive ?? true,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            currentEmployees: true,
          },
        },
      },
    });
  }

  update(id: string, payload: UpdatePositionDto) {
    return this.prisma.position.update({
      where: { id },
      data: {
        ...(payload.companyId !== undefined ? { companyId: payload.companyId } : {}),
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.code !== undefined ? { code: payload.code } : {}),
        ...(payload.level !== undefined ? { level: payload.level } : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            currentEmployees: true,
          },
        },
      },
    });
  }
}
