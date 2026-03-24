import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { HolidayType } from "@prisma/client";

import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { HolidayService } from "./holiday.service";

@ApiTags("holidays")
@ApiBearerAuth()
@Roles("ADMIN", "HR_MANAGER")
@Controller("holidays")
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Permissions("attendance.read")
  @Get()
  findAll(@Query("companyId") companyId: string, @Query("year") year: string) {
    return this.holidayService.findAll(companyId, Number(year));
  }

  @Permissions("attendance.write")
  @Post()
  create(@Body() payload: { companyId: string; year: number; holidayDate: string; name: string; type: HolidayType }) {
    return this.holidayService.create(payload.companyId, payload);
  }

  @Permissions("attendance.write")
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.holidayService.delete(id);
  }
}
