import { Controller, Get, Post, Param, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List recent notifications', description: 'Returns system notifications (PM alerts, defects, compliance reminders, breakdowns).' })
  @ApiResponse({ status: 200, description: 'Notifications list.' })
  getNotifications() {
    return this.notificationsService.getRecentNotifications();
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read', description: 'Dismisses active indicator on an in-app alert.' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked read.' })
  markRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Sse('feed')
  @ApiOperation({ summary: 'Real-time Server-Sent Events (SSE) notification stream', description: 'Live event stream pushing instant fleet notifications to web cockpit.' })
  @ApiResponse({ status: 200, description: 'SSE stream established.' })
  sendNotifications(): Observable<MessageEvent> {
    return this.notificationsService.getNotificationsStream();
  }
}
