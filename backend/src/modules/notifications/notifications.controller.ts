import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuthenticatedUser } from "../../common/types/authenticated-user.type";
import { MarkNotificationReadDto } from "./dto/mark-notification-read.dto";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Permissions("notifications.read")
  @Get("me")
  findMyNotifications(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.findMyNotifications(user, query);
  }

  @Permissions("notifications.read")
  @Get("me/unread-count")
  getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getUnreadCount(user);
  }

  @Permissions("notifications.write")
  @Patch("me/:id/read")
  markOneRead(
    @Param("id") notificationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.markOneRead(user, notificationId);
  }

  @Permissions("notifications.write")
  @Patch("me/read-all")
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user);
  }

  @Permissions("notifications.write")
  @Patch("me/read")
  markManyRead(
    @Body() payload: MarkNotificationReadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.markManyRead(user, payload.notificationIds);
  }
}
