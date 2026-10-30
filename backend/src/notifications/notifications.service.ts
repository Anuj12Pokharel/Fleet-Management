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
  private history: (NotificationEvent & { id: string; read: boolean })[] = [];

  getNotificationsStream() {
    return this.notifications$.asObservable();
  }

  getRecentNotifications() {
    return this.history;
  }

  markAsRead(id: string) {
    const item = this.history.find(n => n.id === id);
    if (item) item.read = true;
    return item;
  }

  emit(notification: NotificationEvent) {
    const fullEvent = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      read: false,
    };
    this.history.unshift(fullEvent);
    if (this.history.length > 100) this.history.pop();

    const sseEvent = {
      data: fullEvent,
    } as MessageEvent;
    this.notifications$.next(sseEvent);
  }
}
