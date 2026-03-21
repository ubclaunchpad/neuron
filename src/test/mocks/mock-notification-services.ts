import type { INotificationEventService } from "@/server/services/notificationEventService";
import type { INotificationService } from "@/server/services/notificationService";
import type { IPreferenceService } from "@/server/services/preferenceService";
import type { NotificationDB } from "@/server/db/schema/notification";
import type {
  EffectivePreference,
  NotificationChannel,
  NotifyParams,
} from "@/server/notifications/types";

export class MockNotificationService implements INotificationService {
  public calls: NotifyParams[] = [];

  async notify(params: NotifyParams): Promise<string | null> {
    this.calls.push(params);
    return "mock-notification-job-id";
  }

  async cancel(): Promise<void> {}

  async getNotifications(): Promise<{
    items: NotificationDB[];
    nextCursor: string | null;
  }> {
    return { items: [], nextCursor: null };
  }

  async getUnreadCount(): Promise<number> {
    return 0;
  }

  async markAsRead(): Promise<void> {}
  async markAsUnread(): Promise<void> {}
  async markAllAsRead(): Promise<void> {}
  async archive(): Promise<void> {}
  async unarchive(): Promise<void> {}
  async archiveAll(): Promise<void> {}

  async processNotification(): Promise<void> {}

  clear() {
    this.calls = [];
  }
}

export class MockPreferenceService implements IPreferenceService {
  async getEffectivePreferences(): Promise<EffectivePreference[]> {
    return [];
  }

  async setPreference(): Promise<void> {}
  async clearPreference(): Promise<void> {}

  async getPreferencesForRecipients(): Promise<
    Map<string, Map<NotificationChannel, boolean>>
  > {
    return new Map();
  }
}

export class MockNotificationEventService
  implements INotificationEventService
{
  public calls: { method: string; params: unknown }[] = [];

  async notifyShiftCancelled(params: unknown): Promise<void> {
    this.calls.push({ method: "notifyShiftCancelled", params });
  }

  async notifyCoverageRequested(params: unknown): Promise<void> {
    this.calls.push({ method: "notifyCoverageRequested", params });
  }

  async notifyShiftReminder(params: unknown): Promise<void> {
    this.calls.push({ method: "notifyShiftReminder", params });
  }

  async notifyShiftNoCheckin(params: unknown): Promise<void> {
    this.calls.push({ method: "notifyShiftNoCheckin", params });
  }

  async notifyCoverageFilled(params: unknown): Promise<void> {
    this.calls.push({ method: "notifyCoverageFilled", params });
  }

  clear() {
    this.calls = [];
  }
}
