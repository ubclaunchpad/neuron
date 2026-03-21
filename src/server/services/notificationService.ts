import type { Drizzle } from "@/server/db";
import {
  notification,
  type NotificationDB,
} from "@/server/db/schema/notification";
import { user } from "@/server/db/schema/user";
import {
  schedule,
  volunteerToSchedule,
  instructorToSchedule,
} from "@/server/db/schema/schedule";
import { shift } from "@/server/db/schema/shift";
import { getNotificationTypeDefinition } from "@/server/notifications/registry";
import type {
  Audience,
  NotificationChannel,
  NotifyParams,
} from "@/server/notifications/types";
import type { IJobService } from "@/server/services/jobService";
import type { IPreferenceService } from "@/server/services/preferenceService";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { and, count, desc, eq, inArray, lt, sql } from "drizzle-orm";
import type { RunnableJobName } from "@/server/jobs/registry";

interface ResolvedRecipient {
  userId: string;
  email: string;
}

export interface INotificationService {
  notify(params: NotifyParams): Promise<string | null>;
  cancel(jobId: string): Promise<void>;

  getNotifications(params: {
    userId: string;
    type?: string;
    read?: boolean;
    archived?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<{ items: NotificationDB[]; nextCursor: string | null }>;

  getUnreadCount(userId: string): Promise<number>;
  markAsRead(notificationId: string, userId: string): Promise<void>;
  markAsUnread(notificationId: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  archive(notificationId: string, userId: string): Promise<void>;
  unarchive(notificationId: string, userId: string): Promise<void>;
  archiveAll(userId: string): Promise<void>;

  processNotification(params: {
    type: string;
    audience: Audience | Audience[];
    context: Record<string, unknown>;
    actorId?: string;
    idempotencyKey?: string;
    excludeUserIds?: string[];
  }): Promise<void>;
}

export class NotificationService implements INotificationService {
  private readonly db: Drizzle;
  private readonly jobService: IJobService;
  private readonly preferenceService: IPreferenceService;

  constructor({
    db,
    jobService,
    preferenceService,
  }: {
    db: Drizzle;
    jobService: IJobService;
    preferenceService: IPreferenceService;
  }) {
    this.db = db;
    this.jobService = jobService;
    this.preferenceService = preferenceService;
  }

  async notify(params: NotifyParams): Promise<string | null> {
    const {
      type,
      audience,
      context,
      actorId,
      deliverAt,
      idempotencyKey,
      excludeUserIds,
    } = params;

    const payload = {
      type,
      audience,
      context,
      actorId,
      idempotencyKey,
      excludeUserIds,
    };

    return this.jobService.run(
      "jobs.process-notification" as RunnableJobName,
      payload as any,
      {
        ...(deliverAt && { startAfter: deliverAt }),
        ...(idempotencyKey && { singletonKey: idempotencyKey }),
      },
    );
  }

  async cancel(jobId: string): Promise<void> {
    await this.jobService.cancelJob(
      "jobs.process-notification" as RunnableJobName,
      jobId,
    );
  }

  async getNotifications({
    userId,
    type,
    read,
    archived,
    limit = 20,
    cursor,
  }: {
    userId: string;
    type?: string;
    read?: boolean;
    archived?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<{ items: NotificationDB[]; nextCursor: string | null }> {
    const conditions = [eq(notification.userId, userId)];

    if (type !== undefined) {
      conditions.push(eq(notification.type, type));
    }
    if (read !== undefined) {
      conditions.push(eq(notification.read, read));
    }
    // Default to non-archived when not explicitly filtering
    conditions.push(
      eq(notification.archived, archived !== undefined ? archived : false),
    );
    if (cursor) {
      conditions.push(lt(notification.createdAt, new Date(cursor)));
    }

    const items = await this.db
      .select()
      .from(notification)
      .where(and(...conditions))
      .orderBy(desc(notification.createdAt))
      .limit(limit + 1);

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1]!.createdAt.toISOString()
        : null;

    return { items, nextCursor };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(notification)
      .where(
        and(
          eq(notification.userId, userId),
          eq(notification.read, false),
          eq(notification.archived, false),
        ),
      );
    return result?.count ?? 0;
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const rows = await this.db
      .update(notification)
      .set({ read: true, readAt: new Date() })
      .where(
        and(
          eq(notification.id, notificationId),
          eq(notification.userId, userId),
        ),
      )
      .returning({ id: notification.id });
    if (rows.length === 0) {
      throw new NeuronError(
        "Notification not found",
        NeuronErrorCodes.NOT_FOUND,
      );
    }
  }

  async markAsUnread(notificationId: string, userId: string): Promise<void> {
    const rows = await this.db
      .update(notification)
      .set({ read: false, readAt: null })
      .where(
        and(
          eq(notification.id, notificationId),
          eq(notification.userId, userId),
        ),
      )
      .returning({ id: notification.id });
    if (rows.length === 0) {
      throw new NeuronError(
        "Notification not found",
        NeuronErrorCodes.NOT_FOUND,
      );
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db
      .update(notification)
      .set({ read: true, readAt: new Date() })
      .where(
        and(
          eq(notification.userId, userId),
          eq(notification.read, false),
          eq(notification.archived, false),
        ),
      );
  }

  async archive(notificationId: string, userId: string): Promise<void> {
    const rows = await this.db
      .update(notification)
      .set({
        archived: true,
        archivedAt: new Date(),
        read: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notification.id, notificationId),
          eq(notification.userId, userId),
        ),
      )
      .returning({ id: notification.id });
    if (rows.length === 0) {
      throw new NeuronError(
        "Notification not found",
        NeuronErrorCodes.NOT_FOUND,
      );
    }
  }

  async unarchive(notificationId: string, userId: string): Promise<void> {
    const rows = await this.db
      .update(notification)
      .set({ archived: false, archivedAt: null })
      .where(
        and(
          eq(notification.id, notificationId),
          eq(notification.userId, userId),
        ),
      )
      .returning({ id: notification.id });
    if (rows.length === 0) {
      throw new NeuronError(
        "Notification not found",
        NeuronErrorCodes.NOT_FOUND,
      );
    }
  }

  async archiveAll(userId: string): Promise<void> {
    await this.db
      .update(notification)
      .set({ archived: true, archivedAt: new Date() })
      .where(
        and(eq(notification.userId, userId), eq(notification.archived, false)),
      );
  }

  async processNotification({
    type,
    audience,
    context,
    actorId,
    idempotencyKey,
    excludeUserIds,
  }: {
    type: string;
    audience: Audience | Audience[];
    context: Record<string, unknown>;
    actorId?: string;
    idempotencyKey?: string;
    excludeUserIds?: string[];
  }): Promise<void> {
    // Check idempotency — per-user keys are stored as `${baseKey}:${userId}`,
    // so we check for any row whose key starts with the base key.
    if (idempotencyKey) {
      const [existing] = await this.db
        .select({ id: notification.id })
        .from(notification)
        .where(
          sql`${notification.idempotencyKey} like ${idempotencyKey + ":%"}`,
        )
        .limit(1);

      if (existing) return;
    }

    const typeDef = getNotificationTypeDefinition(type);
    if (!typeDef) {
      console.warn(`[notification] Unknown notification type: ${type}`);
      return;
    }

    // Resolve audience(s) to recipients
    const audiences = Array.isArray(audience) ? audience : [audience];
    const allRecipients: ResolvedRecipient[] = [];
    for (const aud of audiences) {
      const resolved = await this.resolveAudience(aud);
      allRecipients.push(...resolved);
    }
    const deduplicated = deduplicateRecipients(allRecipients);

    // Apply exclusions
    const excludeSet = new Set(excludeUserIds ?? []);
    const recipients =
      excludeSet.size > 0
        ? deduplicated.filter((r) => !excludeSet.has(r.userId))
        : deduplicated;
    if (recipients.length === 0) return;

    // Resolve preferences in bulk
    const userIds = recipients.map((r) => r.userId);
    const preferences =
      await this.preferenceService.getPreferencesForRecipients({
        type,
        userIds,
      });

    // Render notification content
    const title = typeDef.title(context);
    const body = typeDef.body(context);
    const linkUrl = typeDef.linkUrl?.(context);
    const sourceType = typeDef.sourceType;
    const sourceId = typeDef.sourceId?.(context);

    // Process in_app channel: batch insert notifications
    const inAppRecipients = recipients.filter((r) => {
      const channelPrefs = preferences.get(r.userId);
      return channelPrefs?.get("in_app") !== false;
    });

    if (inAppRecipients.length > 0) {
      // Use the same idempotency key base but append userId for per-user uniqueness
      const notificationRows = inAppRecipients.map((r) => ({
        userId: r.userId,
        type,
        title,
        body,
        linkUrl,
        sourceType,
        sourceId,
        actorId,
        idempotencyKey: idempotencyKey
          ? `${idempotencyKey}:${r.userId}`
          : undefined,
      }));

      await this.db
        .insert(notification)
        .values(notificationRows)
        .onConflictDoNothing({ target: notification.idempotencyKey });
    }

    // Process email channel
    const emailRecipients = recipients.filter((r) => {
      const channelPrefs = preferences.get(r.userId);
      return channelPrefs?.get("email") === true;
    });

    if (emailRecipients.length > 0) {
      // Render HTML email once for all recipients (content is identical)
      let html: string | undefined;
      let emailText: string | undefined;

      if (typeDef.renderEmail) {
        try {
          const rendered = await typeDef.renderEmail(context);
          html = rendered.html;
          emailText = rendered.text;
        } catch (error) {
          console.error(
            `[notification] Failed to render email template for ${type}:`,
            error,
          );
        }
      }

      for (const recipient of emailRecipients) {
        void this.jobService.run("jobs.send-email", {
          to: recipient.email,
          subject: title,
          text: emailText ?? body,
          ...(html ? { html } : {}),
        });
      }
    }
  }

  private async resolveAudience(
    audience: Audience,
  ): Promise<ResolvedRecipient[]> {
    switch (audience.kind) {
      case "user": {
        const [result] = await this.db
          .select({ userId: user.id, email: user.email })
          .from(user)
          .where(eq(user.id, audience.userId));
        return result ? [result] : [];
      }

      case "users": {
        if (audience.userIds.length === 0) return [];
        return this.db
          .select({ userId: user.id, email: user.email })
          .from(user)
          .where(inArray(user.id, audience.userIds));
      }

      case "role": {
        return this.db
          .select({ userId: user.id, email: user.email })
          .from(user)
          .where(and(eq(user.role, audience.role), eq(user.status, "active")));
      }

      case "shift": {
        // Get volunteers assigned to the shift's schedule
        const shiftRow = await this.db
          .select({ scheduleId: shift.scheduleId })
          .from(shift)
          .where(eq(shift.id, audience.shiftId))
          .then((rows) => rows[0]);

        if (!shiftRow) return [];

        const volunteers = await this.db
          .select({ userId: user.id, email: user.email })
          .from(volunteerToSchedule)
          .innerJoin(user, eq(user.id, volunteerToSchedule.volunteerUserId))
          .where(eq(volunteerToSchedule.scheduleId, shiftRow.scheduleId));

        const instructors = await this.db
          .select({ userId: user.id, email: user.email })
          .from(instructorToSchedule)
          .innerJoin(user, eq(user.id, instructorToSchedule.instructorUserId))
          .where(eq(instructorToSchedule.scheduleId, shiftRow.scheduleId));

        return deduplicateRecipients([...volunteers, ...instructors]);
      }

      case "class": {
        // Get all volunteers and instructors across all schedules for a class
        const schedules = await this.db
          .select({ id: schedule.id })
          .from(schedule)
          .where(eq(schedule.courseId, audience.classId));

        const scheduleIds = schedules.map((s) => s.id);
        if (scheduleIds.length === 0) return [];

        const volunteers = await this.db
          .select({ userId: user.id, email: user.email })
          .from(volunteerToSchedule)
          .innerJoin(user, eq(user.id, volunteerToSchedule.volunteerUserId))
          .where(inArray(volunteerToSchedule.scheduleId, scheduleIds));

        const instructors = await this.db
          .select({ userId: user.id, email: user.email })
          .from(instructorToSchedule)
          .innerJoin(user, eq(user.id, instructorToSchedule.instructorUserId))
          .where(inArray(instructorToSchedule.scheduleId, scheduleIds));

        return deduplicateRecipients([...volunteers, ...instructors]);
      }
    }
  }
}

function deduplicateRecipients(
  recipients: ResolvedRecipient[],
): ResolvedRecipient[] {
  const seen = new Set<string>();
  return recipients.filter((r) => {
    if (seen.has(r.userId)) return false;
    seen.add(r.userId);
    return true;
  });
}
