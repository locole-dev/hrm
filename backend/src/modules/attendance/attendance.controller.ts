import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { AttendanceService } from "./attendance.service";
import { AttendanceActionDto } from "./dto/attendance-action.dto";
import { AttendanceMonthQueryDto } from "./dto/attendance-month-query.dto";
import { CreateOvertimeRequestDto } from "./dto/create-overtime-request.dto";
import { OvertimeDecisionDto } from "./dto/overtime-decision.dto";

@ApiTags("attendance")
@ApiBearerAuth()
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles("ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE")
  @Permissions("attendance.read")
  @Get("me")
  findMyAttendanceDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.attendanceService.findMyAttendanceDashboard(user);
  }

  @Roles("ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE")
  @Permissions("attendance.read")
  @Get("me/monthly-summary")
  getMonthlySummary(
    @Query() query: AttendanceMonthQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.getMonthlySummary(query.year, query.month, user);
  }

  @Roles("ADMIN", "HR_MANAGER", "MANAGER")
  @Permissions("attendance.read")
  @Get("manager/approvals")
  getManagerApprovalDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.attendanceService.getManagerApprovalDashboard(user);
  }

  @Roles("ADMIN", "HR_MANAGER", "HR")
  @Permissions("attendance.read")
  @Get("global-summary")
  getGlobalSummary(@Query() query: AttendanceMonthQueryDto) {
    return this.attendanceService.getGlobalSummary(query.year, query.month);
  }

  @Roles("EMPLOYEE", "ADMIN", "HR_MANAGER", "HR")
  @Permissions("attendance.write")
  @Post("me/check-in")
  checkIn(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: AttendanceActionDto,
  ) {
    return this.attendanceService.checkIn(user, payload);
  }

  @Roles("EMPLOYEE", "ADMIN", "HR_MANAGER", "HR")
  @Permissions("attendance.write")
  @Post("me/check-out")
  checkOut(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: AttendanceActionDto,
  ) {
    return this.attendanceService.checkOut(user, payload);
  }

  @Roles("ADMIN", "HR_MANAGER", "HR", "MANAGER")
  @Permissions("attendance.read")
  @Get("records")
  findRecords(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.findRecords(query, user);
  }

  @Roles("ADMIN", "HR_MANAGER", "MANAGER")
  @Permissions("attendance.approve_ot")
  @Get("overtime-requests")
  findPendingOvertime(@CurrentUser() user: AuthenticatedUser) {
    return this.attendanceService.findPendingOvertime(user);
  }

  @Roles("ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE")
  @Permissions("attendance.write")
  @Post("overtime-requests")
  createOvertimeRequest(
    @Body() payload: CreateOvertimeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.createOvertimeRequest(payload, user);
  }

  @Roles("ADMIN", "HR_MANAGER", "MANAGER")
  @Permissions("attendance.approve_ot")
  @Patch("overtime-requests/:id/decision")
  decideOvertime(
    @Param("id") overtimeRequestId: string,
    @Body() payload: OvertimeDecisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.decideOvertime(
      overtimeRequestId,
      payload,
      user,
    );
  }
}
