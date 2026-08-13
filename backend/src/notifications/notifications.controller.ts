import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('feed')
  sendNotifications(): Observable<MessageEvent> {
    return this.notificationsService.getNotificationsStream();
  }
}
