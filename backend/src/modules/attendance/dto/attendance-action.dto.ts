import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class AttendanceActionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
