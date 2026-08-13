import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface NotificationEvent {
  type: string; // 'WORK_ORDER' | 'PM_ALERT' | 'BREAKDOWN' | 'COMPLIANCE'
  title: string;
  message: string;
  assetId?: string;
  timestamp: string;
}

@Injectable()
export class NotificationsService {
  private notifications$ = new Subject<MessageEvent>();

  getNotificationsStream() {
    return this.notifications$.asObservable();
  }

  emit(notification: NotificationEvent) {
    const sseEvent = {
      data: notification,
    } as MessageEvent;
    this.notifications$.next(sseEvent);
  }
}
