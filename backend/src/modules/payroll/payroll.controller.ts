import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { CreatePayrollPeriodDto } from "./dto/create-payroll-period.dto";
import { PayrollService } from "./payroll.service";
import { RunPayrollDraftDto } from "./dto/run-payroll-draft.dto";
import { UpsertPayrollRulesDto } from "./dto/upsert-payroll-rules.dto";

@ApiTags("payroll")
@ApiBearerAuth()
@Roles("ADMIN", "HR_MANAGER", "PAYROLL")
@Controller("payroll")
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Permissions("payroll.read")
  @Get("periods")
  findPeriods(@Query() query: PaginationQueryDto) {
    return this.payrollService.findPeriods(query);
  }

  @Permissions("payroll.read")
  @Get("config/context")
  getConfigContext() {
    return this.payrollService.getConfigContext();
  }

  @Permissions("payroll.read")
  @Get("config/rules")
  getRules(
    @Query("companyId") companyId: string,
    @Query("year") year: string,
  ) {
    return this.payrollService.getRules(companyId, Number(year));
  }

  @Permissions("payroll.read")
  @Get("me")
  findMyPayslips(@CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.findMyPayslips(user);
  }

  @Permissions("payroll.write")
  @Post("periods")
  createPeriod(@Body() payload: CreatePayrollPeriodDto) {
    return this.payrollService.createPeriod(payload);
  }

  @Roles("ADMIN", "HR_MANAGER")
  @Permissions("payroll.write")
  @Patch("config/rules")
  saveRules(@Body() payload: UpsertPayrollRulesDto) {
    return this.payrollService.saveRules(payload);
  }

  @Permissions("payroll.read")
  @Get("periods/:periodId/payslips")
  findPayslips(@Param("periodId") periodId: string) {
    return this.payrollService.findPayslips(periodId);
  }

  @Roles("ADMIN", "HR_MANAGER")
  @Permissions("payroll.lock")
  @Patch("periods/:periodId/lock")
  lockPeriod(
    @Param("periodId") periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payrollService.lockPeriod(periodId, user);
  }

  @Roles("ADMIN", "HR_MANAGER")
  @Permissions("payroll.lock")
  @Patch("periods/:periodId/unlock")
  unlockPeriod(
    @Param("periodId") periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payrollService.unlockPeriod(periodId, user);
  }

  @Permissions("payroll.write")
  @Patch("periods/:periodId/publish")
  publishPeriod(
    @Param("periodId") periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payrollService.publishPeriod(periodId, user);
  }

  @Permissions("payroll.write")
  @Post("periods/:periodId/run-draft")
  runDraft(
    @Param("periodId") periodId: string,
    @Body() payload: RunPayrollDraftDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payrollService.runDraft(periodId, payload, user);
  }
}
