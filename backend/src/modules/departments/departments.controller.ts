import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { DepartmentsService } from "./departments.service";

@ApiTags("departments")
@ApiBearerAuth()
@Roles("ADMIN", "HR_MANAGER", "HR")
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Permissions("employees.read")
  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Permissions("employees.read")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.departmentsService.findOne(id);
  }

  @Permissions("employees.write")
  @Post()
  create(@Body() payload: CreateDepartmentDto) {
    return this.departmentsService.create(payload);
  }

  @Permissions("employees.write")
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateDepartmentDto) {
    return this.departmentsService.update(id, payload);
  }
}
