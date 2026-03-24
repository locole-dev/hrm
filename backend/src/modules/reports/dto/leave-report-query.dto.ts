import { ApprovalStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

import { ReportMonthQueryDto } from "./report-month-query.dto";

export class LeaveReportQueryDto extends ReportMonthQueryDto {
  @IsOptional()
  @IsUUID("4")
  departmentId?: string;

  @IsOptional()
  @IsUUID("4")
  leaveTypeId?: string;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;
}
