import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreatePositionDto } from "./dto/create-position.dto";
import { UpdatePositionDto } from "./dto/update-position.dto";
import { PositionsService } from "./positions.service";

@ApiTags("positions")
@ApiBearerAuth()
@Roles("ADMIN", "HR_MANAGER", "HR")
@Controller("positions")
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Permissions("employees.read")
  @Get()
  findAll() {
    return this.positionsService.findAll();
  }

  @Permissions("employees.write")
  @Post()
  create(@Body() payload: CreatePositionDto) {
    return this.positionsService.create(payload);
  }

  @Permissions("employees.write")
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdatePositionDto) {
    return this.positionsService.update(id, payload);
  }
}
