import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { CancelLeaveRequestDto } from "./dto/cancel-leave-request.dto";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";
import { LeaveDecisionDto } from "./dto/leave-decision.dto";
import { LeaveService } from "./leave.service";

@ApiTags("leave")
@ApiBearerAuth()
@Controller("leave")
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Roles("ADMIN", "HR_MANAGER", "HR", "MANAGER")
  @Permissions("leave.read")
  @Get("requests")
  findRequests(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveService.findRequests(query, user);
  }

  @Roles("ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE")
  @Permissions("leave.read")
  @Get("types")
  findTypes() {
    return this.leaveService.findTypes();
  }

  @Roles("ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE")
  @Permissions("leave.read")
  @Get("me")
  findMyLeaveDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.leaveService.findMyLeaveDashboard(user);
  }

  @Roles("ADMIN", "HR_MANAGER", "HR", "MANAGER")
  @Permissions("leave.read")
  @Get("manager/approvals")
  getManagerApprovalDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.leaveService.getManagerApprovalDashboard(user);
  }

  @Roles("ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE")
  @Permissions("leave.read")
  @Get("balances/:employeeId")
  findBalances(
    @Param("employeeId") employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveService.findBalances(employeeId, user);
  }

  @Roles("ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE")
  @Permissions("leave.write")
  @Post("requests")
  createRequest(
    @Body() payload: CreateLeaveRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveService.createRequest(payload, user);
  }

  @Roles("ADMIN", "HR_MANAGER", "HR", "MANAGER")
  @Permissions("leave.approve")
  @Patch("requests/:id/decision")
  decideRequest(
    @Param("id") requestId: string,
    @Body() payload: LeaveDecisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveService.decideRequest(requestId, payload, user);
  }

  @Roles("ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE")
  @Permissions("leave.write")
  @Patch("requests/:id/cancel")
  cancelRequest(
    @Param("id") requestId: string,
    @Body() payload: CancelLeaveRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveService.cancelRequest(requestId, payload, user);
  }
}
