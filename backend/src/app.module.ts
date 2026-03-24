import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AttendanceModule } from "./modules/attendance/attendance.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { EmployeesModule } from "./modules/employees/employees.module";
import { HealthModule } from "./modules/health/health.module";
import { LeaveModule } from "./modules/leave/leave.module";
import { ManagerModule } from "./modules/manager/manager.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { HolidayModule } from "./modules/holidays/holiday.module";
import { PayrollModule } from "./modules/payroll/payroll.module";
import { PositionsModule } from "./modules/positions/positions.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    AuditModule,
    NotificationsModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    EmployeesModule,
    DepartmentsModule,
    AttendanceModule,
    LeaveModule,
    ManagerModule,
    PayrollModule,
    PositionsModule,
    ReportsModule,
    HolidayModule,
  ],
})
export class AppModule {}
