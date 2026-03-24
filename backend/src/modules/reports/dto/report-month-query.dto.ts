import { Transform } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class ReportMonthQueryDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  year!: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}
