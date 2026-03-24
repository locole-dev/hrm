import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { ManagerMonthQueryDto } from "./dto/manager-month-query.dto";
import { ManagerService } from "./manager.service";

@ApiTags("manager")
@ApiBearerAuth()
@Roles("ADMIN", "HR_MANAGER", "MANAGER")
@Controller("manager")
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Permissions("manager.read")
  @Get("team")
  getMyTeam(@CurrentUser() user: AuthenticatedUser) {
    return this.managerService.getMyTeam(user);
  }

  @Permissions("manager.read")
  @Get("team/attendance")
  getTeamAttendanceSnapshot(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ManagerMonthQueryDto,
  ) {
    return this.managerService.getTeamAttendanceSnapshot(
      user,
      query.year,
      query.month,
    );
  }

  @Permissions("manager.read")
  @Get("team/approvals")
  getTeamApprovalQueues(@CurrentUser() user: AuthenticatedUser) {
    return this.managerService.getTeamApprovalQueues(user);
  }

  @Permissions("manager.read")
  @Get("team/:employeeId")
  getTeamMemberDetail(
    @Param("employeeId") employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.managerService.getTeamMemberDetail(user, employeeId);
  }
}
