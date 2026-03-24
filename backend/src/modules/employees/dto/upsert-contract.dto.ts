import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ContractType } from "@prisma/client";
import { IsBoolean, IsDateString, IsEnum, IsNumberString, IsOptional, IsString } from "class-validator";

export class UpsertContractDto {
  @ApiProperty({ enum: ContractType })
  @IsEnum(ContractType)
  contractType!: ContractType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contractNumber?: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty()
  @IsNumberString()
  baseSalary!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  salaryBasisAmount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salaryCurrency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
