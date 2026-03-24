import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { ListEmployeesQueryDto } from "./dto/list-employees-query.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { UpsertContractDto } from "./dto/upsert-contract.dto";
import { EmployeesService } from "./employees.service";

@ApiTags("employees")
@ApiBearerAuth()
@Roles("ADMIN", "HR_MANAGER", "HR")
@Controller("employees")
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Roles("ADMIN", "HR_MANAGER", "HR", "EMPLOYEE", "MANAGER", "PAYROLL")
  @Permissions("employees.read")
  @Get("me")
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.findMe(user);
  }

  @Permissions("employees.read")
  @Get()
  findAll(@Query() query: ListEmployeesQueryDto) {
    return this.employeesService.findAll(query);
  }

  @Permissions("employees.read")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.employeesService.findOne(id);
  }

  @Permissions("employees.write")
  @Post()
  create(@Body() payload: CreateEmployeeDto) {
    return this.employeesService.create(payload);
  }

  @Permissions("employees.write")
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateEmployeeDto) {
    return this.employeesService.update(id, payload);
  }

  @Permissions("employees.write")
  @Post(":id/contracts")
  createContract(@Param("id") id: string, @Body() payload: UpsertContractDto) {
    return this.employeesService.createContract(id, payload);
  }

  @Permissions("employees.write")
  @Patch(":id/contracts/:contractId")
  updateContract(
    @Param("id") id: string,
    @Param("contractId") contractId: string,
    @Body() payload: UpsertContractDto,
  ) {
    return this.employeesService.updateContract(id, contractId, payload);
  }
}
