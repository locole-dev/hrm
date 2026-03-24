import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

class UpsertTaxBracketDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  bracketOrder!: number;

  @ApiProperty()
  @IsNumberString()
  fromAmount!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  toAmount?: string;

  @ApiProperty()
  @IsNumberString()
  rate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  quickDeduction?: string;
}

class UpsertInsuranceRuleDto {
  @ApiProperty()
  @IsDateString()
  effectiveFrom!: string;

  @ApiProperty()
  @IsNumberString()
  employeeBhxhRate!: string;

  @ApiProperty()
  @IsNumberString()
  employeeBhytRate!: string;

  @ApiProperty()
  @IsNumberString()
  employeeBhtnRate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  employerBhxhRate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  employerBhytRate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  employerBhtnRate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  salaryCap?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

class UpsertTaxRuleDto {
  @ApiProperty()
  @IsDateString()
  effectiveFrom!: string;

  @ApiProperty()
  @IsNumberString()
  personalDeduction!: string;

  @ApiProperty()
  @IsNumberString()
  dependentDeduction!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [UpsertTaxBracketDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertTaxBracketDto)
  brackets!: UpsertTaxBracketDto[];
}

export class UpsertPayrollRulesDto {
  @ApiProperty()
  @IsUUID()
  companyId!: string;

  @ApiProperty()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiProperty({ type: UpsertInsuranceRuleDto })
  @ValidateNested()
  @Type(() => UpsertInsuranceRuleDto)
  insuranceRule!: UpsertInsuranceRuleDto;

  @ApiProperty({ type: UpsertTaxRuleDto })
  @ValidateNested()
  @Type(() => UpsertTaxRuleDto)
  taxRule!: UpsertTaxRuleDto;
}
