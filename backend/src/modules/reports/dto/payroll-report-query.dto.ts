import { PayslipStatus, PayrollPeriodStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

import { ReportMonthQueryDto } from "./report-month-query.dto";

export class PayrollReportQueryDto extends ReportMonthQueryDto {
  @IsOptional()
  @IsUUID("4")
  departmentId?: string;

  @IsOptional()
  @IsEnum(PayrollPeriodStatus)
  periodStatus?: PayrollPeriodStatus;

  @IsOptional()
  @IsEnum(PayslipStatus)
  payslipStatus?: PayslipStatus;
}
