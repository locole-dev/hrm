import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class CreatePayrollPeriodDto {
  @ApiProperty()
  @IsUUID()
  companyId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty()
  @IsInt()
  year!: number;

  @ApiProperty({ minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty()
  @IsDateString()
  periodStart!: string;

  @ApiProperty()
  @IsDateString()
  periodEnd!: string;
}
