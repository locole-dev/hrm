import { EmploymentStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

export class HrSummaryQueryDto {
  @IsOptional()
  @IsUUID("4")
  departmentId?: string;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;
}
