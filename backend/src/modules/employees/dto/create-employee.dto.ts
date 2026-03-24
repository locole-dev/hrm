import { ApiProperty } from "@nestjs/swagger";
import { Gender } from "@prisma/client";
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateEmployeeDto {
  @ApiProperty()
  @IsUUID()
  companyId!: string;

  @ApiProperty()
  @IsUUID()
  branchId!: string;

  @ApiProperty()
  @IsString()
  employeeCode!: string;

  @ApiProperty()
  @IsEmail()
  companyEmail!: string;

  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiProperty()
  @IsUUID()
  currentDepartmentId!: string;

  @ApiProperty()
  @IsUUID()
  currentPositionId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  currentManagerEmployeeId?: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({ required: false, enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
