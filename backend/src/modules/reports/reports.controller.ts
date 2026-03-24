import { Controller, Get, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Response } from "express";

import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AttendanceReportQueryDto } from "./dto/attendance-report-query.dto";
import { HrSummaryQueryDto } from "./dto/hr-summary-query.dto";
import { LeaveReportQueryDto } from "./dto/leave-report-query.dto";
import { PayrollReportQueryDto } from "./dto/payroll-report-query.dto";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@ApiBearerAuth()
@Roles("ADMIN", "HR_MANAGER", "HR", "PAYROLL")
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private sendCsv(res: Response, filename: string, content: string) {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(content);
  }

  @Permissions("reports.read")
  @Get("hr-summary")
  getHrSummary(@Query() query: HrSummaryQueryDto) {
    return this.reportsService.getHrSummary(query);
  }

  @Permissions("reports.read")
  @Get("hr-summary/export.csv")
  async exportHrSummaryCsv(
    @Query() query: HrSummaryQueryDto,
    @Res() res: Response,
  ) {
    const content = await this.reportsService.exportHrSummaryCsv(query);
    this.sendCsv(res, "hr-summary.csv", content);
  }

  @Permissions("reports.read")
  @Get("attendance-summary")
  getAttendanceSummary(@Query() query: AttendanceReportQueryDto) {
    return this.reportsService.getAttendanceSummary(query);
  }

  @Permissions("reports.read")
  @Get("attendance-summary/export.csv")
  async exportAttendanceSummaryCsv(
    @Query() query: AttendanceReportQueryDto,
    @Res() res: Response,
  ) {
    const content = await this.reportsService.exportAttendanceSummaryCsv(query);
    this.sendCsv(res, "attendance-summary.csv", content);
  }

  @Permissions("reports.read")
  @Get("leave-summary")
  getLeaveSummary(@Query() query: LeaveReportQueryDto) {
    return this.reportsService.getLeaveSummary(query);
  }

  @Permissions("reports.read")
  @Get("leave-summary/export.csv")
  async exportLeaveSummaryCsv(
    @Query() query: LeaveReportQueryDto,
    @Res() res: Response,
  ) {
    const content = await this.reportsService.exportLeaveSummaryCsv(query);
    this.sendCsv(res, "leave-summary.csv", content);
  }

  @Permissions("reports.read")
  @Get("payroll-summary")
  getPayrollSummary(@Query() query: PayrollReportQueryDto) {
    return this.reportsService.getPayrollSummary(query);
  }

  @Permissions("reports.read")
  @Get("payroll-summary/export.csv")
  async exportPayrollSummaryCsv(
    @Query() query: PayrollReportQueryDto,
    @Res() res: Response,
  ) {
    const content = await this.reportsService.exportPayrollSummaryCsv(query);
    this.sendCsv(res, "payroll-summary.csv", content);
  }
}
