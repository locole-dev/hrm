import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";

const departmentInclude = {
  branch: true,
  managerEmployee: {
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      companyEmail: true,
      currentPosition: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  },
  currentEmployees: {
    include: {
      currentPosition: true,
      manager: {
        select: {
          id: true,
          fullName: true,
          companyEmail: true,
        },
      },
    },
    orderBy: {
      fullName: "asc" as const,
    },
  },
  _count: {
    select: {
      currentEmployees: true,
    },
  },
};

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const departments = await this.prisma.department.findMany({
      include: departmentInclude,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return departments.map((department) => ({
      ...department,
      summary: {
        employeeCount: department._count.currentEmployees,
        activeCount: department.currentEmployees.filter((employee) =>
          ["ACTIVE", "PROBATION"].includes(employee.employmentStatus),
        ).length,
        managerCount: department.currentEmployees.filter(
          (employee) => employee.currentManagerEmployeeId === null,
        ).length,
        positions: Array.from(
          new Set(department.currentEmployees.map((employee) => employee.currentPosition?.name ?? "-")),
        ).length,
      },
    }));
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: departmentInclude,
    });

    if (!department) {
      throw new NotFoundException("Department not found");
    }

    const statusSummary = department.currentEmployees.reduce<Record<string, number>>((acc, employee) => {
      acc[employee.employmentStatus] = (acc[employee.employmentStatus] ?? 0) + 1;
      return acc;
    }, {});

    const positionSummary = department.currentEmployees.reduce<Record<string, number>>((acc, employee) => {
      const key = employee.currentPosition?.name ?? "Unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return {
      ...department,
      summary: {
        employeeCount: department._count.currentEmployees,
        activeCount: department.currentEmployees.filter((employee) =>
          ["ACTIVE", "PROBATION"].includes(employee.employmentStatus),
        ).length,
        statusSummary,
        positionSummary,
      },
    };
  }

  async create(payload: CreateDepartmentDto) {
    const data = {
      name: payload.name,
      code: payload.code,
      branch: {
        connect: { id: payload.branchId },
      },
      ...(payload.managerEmployeeId
        ? { managerEmployee: { connect: { id: payload.managerEmployeeId } } }
        : {}),
    };

    const department = await this.prisma.department.create({
      data,
      select: {
        id: true,
      },
    });

    return this.findOne(department.id);
  }

  async update(id: string, payload: UpdateDepartmentDto) {
    await this.prisma.department.update({
      where: { id },
      data: {
        ...(payload.code !== undefined ? { code: payload.code } : {}),
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
        ...(payload.managerEmployeeId !== undefined
          ? {
              managerEmployee: payload.managerEmployeeId
                ? { connect: { id: payload.managerEmployeeId } }
                : { disconnect: true },
            }
          : {}),
      },
    });

    return this.findOne(id);
  }
}
