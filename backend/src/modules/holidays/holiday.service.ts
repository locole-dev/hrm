import { Injectable } from "@nestjs/common";
import { HolidayType } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HolidayService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, year: number) {
    const calendar = await this.prisma.holidayCalendar.findUnique({
      where: { companyId_year: { companyId, year } },
      include: {
        holidays: {
          orderBy: { holidayDate: "asc" },
        },
      },
    });
    return calendar?.holidays ?? [];
  }

  async create(companyId: string, payload: { year: number; holidayDate: string; name: string; type: HolidayType }) {
    const calendar = await this.prisma.holidayCalendar.upsert({
      where: { companyId_year: { companyId, year: payload.year } },
      update: {},
      create: {
        companyId,
        year: payload.year,
        name: `Calendar ${payload.year}`,
      },
    });

    return this.prisma.holiday.create({
      data: {
        holidayCalendarId: calendar.id,
        holidayDate: new Date(payload.holidayDate),
        name: payload.name,
        holidayType: payload.type,
      },
    });
  }

  delete(id: string) {
    return this.prisma.holiday.delete({
      where: { id },
    });
  }
}
