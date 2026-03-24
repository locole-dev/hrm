import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuditService } from "./audit.service";

@ApiTags("audit")
@ApiBearerAuth()
@Roles("ADMIN", "HR_MANAGER")
@Controller("audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Permissions("audit.read")
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.auditService.findAll(query);
  }
}
