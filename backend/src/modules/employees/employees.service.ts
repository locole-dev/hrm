import { ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { UpsertContractDto } from "./dto/upsert-contract.dto";

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly employeeDetailInclude = {
    company: {
      select: {
        id: true,
        name: true,
        code: true,
      },
    },
    branch: {
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        address: true,
      },
    },
    currentDepartment: {
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        managerEmployee: {
          select: {
            id: true,
            fullName: true,
            companyEmail: true,
          },
        },
      },
    },
    currentPosition: true,
    manager: {
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
    defaultShift: true,
    contracts: {
      orderBy: { startDate: "desc" as const },
    },
    leaveBalances: {
      include: {
        leaveType: true,
      },
      orderBy: [{ year: "desc" as const }, { createdAt: "desc" as const }],
    },
    orgHistories: {
      include: {
        department: true,
        position: true,
        managerEmployee: {
          select: {
            id: true,
            fullName: true,
            companyEmail: true,
          },
        },
      },
      orderBy: { effectiveFrom: "desc" as const },
    },
    attendanceRecords: {
      orderBy: { workDate: "desc" as const },
      take: 8,
    },
    leaveRequests: {
      include: {
        leaveType: true,
      },
      orderBy: { submittedAt: "desc" as const },
      take: 8,
    },
    overtimeRequests: {
      orderBy: { workDate: "desc" as const },
      take: 8,
    },
    user: {
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    },
  } satisfies Prisma.EmployeeInclude;

  async findAll(query: PaginationQueryDto & { departmentId?: string; positionId?: string; employmentStatus?: string }) {
    const where: Prisma.EmployeeWhereInput = {};

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: "insensitive" } },
        { employeeCode: { contains: query.search, mode: "insensitive" } },
        { companyEmail: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.departmentId && query.departmentId !== "all") {
      where.currentDepartmentId = query.departmentId;
    }

    if (query.positionId && query.positionId !== "all") {
      where.currentPositionId = query.positionId;
    }

    if (query.employmentStatus && query.employmentStatus !== "all") {
      where.employmentStatus = query.employmentStatus as any;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          currentDepartment: true,
          currentPosition: true,
          manager: true,
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  findOne(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: this.employeeDetailInclude,
    });
  }

  findMe(user: AuthenticatedUser) {
    if (!user.employeeId) {
      throw new ForbiddenException("Employee context is required");
    }

    return this.findOne(user.employeeId);
  }

  create(payload: CreateEmployeeDto) {
    const data: Prisma.EmployeeCreateInput = {
      employeeCode: payload.employeeCode,
      companyEmail: payload.companyEmail,
      firstName: payload.firstName,
      lastName: payload.lastName,
      fullName: `${payload.firstName} ${payload.lastName}`,
      startDate: new Date(payload.startDate),
      gender: payload.gender,
      company: {
        connect: { id: payload.companyId },
      },
      branch: {
        connect: { id: payload.branchId },
      },
      currentDepartment: {
        connect: { id: payload.currentDepartmentId },
      },
      currentPosition: {
        connect: { id: payload.currentPositionId },
      },
      ...(payload.currentManagerEmployeeId
        ? { manager: { connect: { id: payload.currentManagerEmployeeId } } }
        : {}),
    };

    return this.prisma.employee.create({
      data,
    });
  }

  async update(id: string, payload: UpdateEmployeeDto) {
    const data: Prisma.EmployeeUpdateInput = {
      ...("companyEmail" in payload ? { companyEmail: payload.companyEmail } : {}),
      ...("personalEmail" in payload ? { personalEmail: payload.personalEmail } : {}),
      ...("firstName" in payload ? { firstName: payload.firstName } : {}),
      ...("lastName" in payload ? { lastName: payload.lastName } : {}),
      ...("gender" in payload ? { gender: payload.gender } : {}),
      ...("phoneNumber" in payload ? { phoneNumber: payload.phoneNumber } : {}),
      ...("nationalId" in payload ? { nationalId: payload.nationalId } : {}),
      ...("address" in payload ? { address: payload.address } : {}),
      ...("emergencyContactName" in payload ? { emergencyContactName: payload.emergencyContactName } : {}),
      ...("emergencyContactPhone" in payload ? { emergencyContactPhone: payload.emergencyContactPhone } : {}),
      ...("bankAccountName" in payload ? { bankAccountName: payload.bankAccountName } : {}),
      ...("bankAccountNumber" in payload ? { bankAccountNumber: payload.bankAccountNumber } : {}),
      ...("employmentStatus" in payload ? { employmentStatus: payload.employmentStatus } : {}),
      ...("birthDate" in payload ? { birthDate: payload.birthDate ? new Date(payload.birthDate) : null } : {}),
      ...("startDate" in payload ? { startDate: payload.startDate ? new Date(payload.startDate) : undefined } : {}),
      ...("endDate" in payload ? { endDate: payload.endDate ? new Date(payload.endDate) : null } : {}),
      ...("branchId" in payload ? { branch: { connect: { id: payload.branchId } } } : {}),
      ...("companyId" in payload ? { company: { connect: { id: payload.companyId } } } : {}),
      ...("currentDepartmentId" in payload ? { currentDepartment: { connect: { id: payload.currentDepartmentId } } } : {}),
      ...("currentPositionId" in payload ? { currentPosition: { connect: { id: payload.currentPositionId } } } : {}),
      ...("currentManagerEmployeeId" in payload
        ? {
            manager: payload.currentManagerEmployeeId
              ? { connect: { id: payload.currentManagerEmployeeId } }
              : { disconnect: true },
          }
        : {}),
      ...("defaultShiftId" in payload
        ? {
            defaultShift: payload.defaultShiftId
              ? { connect: { id: payload.defaultShiftId } }
              : { disconnect: true },
          }
        : {}),
    };

    if (payload.firstName || payload.lastName) {
      const currentEmployee = await this.prisma.employee.findUniqueOrThrow({
        where: { id },
        select: { firstName: true, lastName: true },
      });

      const firstName = payload.firstName ?? currentEmployee.firstName;
      const lastName = payload.lastName ?? currentEmployee.lastName;
      data.fullName = `${firstName} ${lastName}`.trim();
    }

    return this.findOne(
      (
        await this.prisma.employee.update({
          where: { id },
          data,
          select: { id: true },
        })
      ).id,
    );
  }

  async createContract(employeeId: string, payload: UpsertContractDto) {
    await this.prisma.employmentContract.create({
      data: {
        employeeId,
        contractType: payload.contractType,
        contractNumber: payload.contractNumber,
        startDate: new Date(payload.startDate),
        endDate: payload.endDate ? new Date(payload.endDate) : null,
        baseSalary: new Prisma.Decimal(payload.baseSalary),
        salaryBasisAmount: payload.salaryBasisAmount ? new Prisma.Decimal(payload.salaryBasisAmount) : null,
        salaryCurrency: payload.salaryCurrency ?? "VND",
        isPrimary: payload.isPrimary ?? true,
        isActive: payload.isActive ?? true,
      },
    });

    return this.findOne(employeeId);
  }

  async updateContract(employeeId: string, contractId: string, payload: UpsertContractDto) {
    await this.prisma.employmentContract.findFirstOrThrow({
      where: { id: contractId, employeeId },
      select: { id: true },
    });

    await this.prisma.employmentContract.update({
      where: { id: contractId },
      data: {
        contractType: payload.contractType,
        contractNumber: payload.contractNumber,
        startDate: new Date(payload.startDate),
        endDate: payload.endDate ? new Date(payload.endDate) : null,
        baseSalary: new Prisma.Decimal(payload.baseSalary),
        salaryBasisAmount: payload.salaryBasisAmount ? new Prisma.Decimal(payload.salaryBasisAmount) : null,
        salaryCurrency: payload.salaryCurrency ?? "VND",
        isPrimary: payload.isPrimary ?? true,
        isActive: payload.isActive ?? true,
      },
    });

    return this.findOne(employeeId);
  }
}
