import { AttendanceStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

import { ReportMonthQueryDto } from "./report-month-query.dto";

export class AttendanceReportQueryDto extends ReportMonthQueryDto {
  @IsOptional()
  @IsUUID("4")
  departmentId?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  attendanceStatus?: AttendanceStatus;
}
