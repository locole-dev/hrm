import { ApiProperty } from "@nestjs/swagger";
import { OvertimeDayType } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateOvertimeRequestDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty()
  @IsDateString()
  workDate!: string;

  @ApiProperty()
  @IsDateString()
  startAt!: string;

  @ApiProperty()
  @IsDateString()
  endAt!: string;

  @ApiProperty({ minimum: 1 })
  @Min(1)
  totalMinutes!: number;

  @ApiProperty({ enum: OvertimeDayType })
  @IsEnum(OvertimeDayType)
  overtimeDayType!: OvertimeDayType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  requestedNote?: string;
}
