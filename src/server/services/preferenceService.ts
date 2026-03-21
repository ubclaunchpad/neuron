import type { Drizzle } from "@/server/db";
import {
  notificationPreference,
  type NotificationPreferenceDB,
} from "@/server/db/schema/notification";
import {
  allNotificationTypes,
  notificationTypes,
  type NotificationType,
} from "@/server/notifications/registry";
import type { Role } from "@/models/interfaces";
import type {
  EffectivePreference,
  NotificationChannel,
} from "@/server/notifications/types";
import { and, eq, inArray } from "drizzle-orm";

export interface IPreferenceService {
  getEffectivePreferences(
    userId: string,
    role: Role,
  ): Promise<EffectivePreference[]>;

  setPreference(params: {
    userId: string;
    type: string;
    channel: NotificationChannel;
    enabled: boolean;
  }): Promise<void>;

  clearPreference(params: {
    userId: string;
    type: string;
    channel: NotificationChannel;
  }): Promise<void>;

  getPreferencesForRecipients(params: {
    type: string;
    userIds: string[];
  }): Promise<Map<string, Map<NotificationChannel, boolean>>>;
}

export class PreferenceService implements IPreferenceService {
  private readonly db: Drizzle;

  constructor({ db }: { db: Drizzle }) {
    this.db = db;
  }

  async getEffectivePreferences(
    userId: string,
    role: Role,
  ): Promise<EffectivePreference[]> {
    const overrides = await this.db
      .select()
      .from(notificationPreference)
      .where(eq(notificationPreference.userId, userId));

    const overrideMap = new Map<string, NotificationPreferenceDB>();
    for (const row of overrides) {
      overrideMap.set(`${row.type}:${row.channel}`, row);
    }

    const result: EffectivePreference[] = [];

    for (const typeKey of allNotificationTypes) {
      const typeDef = notificationTypes[typeKey];

      // Only include notification types applicable to this role
      if (!(typeDef.applicableRoles as readonly string[]).includes(role))
        continue;

      const channels = Object.entries(typeDef.channelDefaults) as [
        NotificationChannel,
        boolean,
      ][];

      const description =
        typeof typeDef.description === "string"
          ? typeDef.description
          : ((typeDef.description as Record<string, string>)[role] ??
              Object.values(typeDef.description)[0] ??
              "");

      for (const [channel, defaultEnabled] of channels) {
        const override = overrideMap.get(`${typeKey}:${channel}`);
        result.push({
          type: typeKey,
          label: typeDef.label,
          description,
          channel,
          enabled: override ? override.enabled : defaultEnabled,
          isOverride: !!override,
        });
      }
    }

    return result;
  }

  async setPreference({
    userId,
    type,
    channel,
    enabled,
  }: {
    userId: string;
    type: string;
    channel: NotificationChannel;
    enabled: boolean;
  }): Promise<void> {
    await this.db
      .insert(notificationPreference)
      .values({ userId, type, channel, enabled })
      .onConflictDoUpdate({
        target: [
          notificationPreference.userId,
          notificationPreference.type,
          notificationPreference.channel,
        ],
        set: { enabled, updatedAt: new Date() },
      });
  }

  async clearPreference({
    userId,
    type,
    channel,
  }: {
    userId: string;
    type: string;
    channel: NotificationChannel;
  }): Promise<void> {
    await this.db
      .delete(notificationPreference)
      .where(
        and(
          eq(notificationPreference.userId, userId),
          eq(notificationPreference.type, type),
          eq(notificationPreference.channel, channel),
        ),
      );
  }

  async getPreferencesForRecipients({
    type,
    userIds,
  }: {
    type: string;
    userIds: string[];
  }): Promise<Map<string, Map<NotificationChannel, boolean>>> {
    const typeDef = notificationTypes[type as NotificationType];
    const defaults = typeDef?.channelDefaults ?? {};

    const result = new Map<string, Map<NotificationChannel, boolean>>();

    // Initialize with defaults for all users
    for (const userId of userIds) {
      const channelMap = new Map<NotificationChannel, boolean>();
      for (const [channel, enabled] of Object.entries(defaults)) {
        channelMap.set(channel as NotificationChannel, enabled);
      }
      result.set(userId, channelMap);
    }

    if (userIds.length === 0) return result;

    // Load overrides in bulk
    const overrides = await this.db
      .select()
      .from(notificationPreference)
      .where(
        and(
          inArray(notificationPreference.userId, userIds),
          eq(notificationPreference.type, type),
        ),
      );

    // Apply overrides
    for (const override of overrides) {
      const channelMap = result.get(override.userId);
      if (channelMap) {
        channelMap.set(
          override.channel as NotificationChannel,
          override.enabled,
        );
      }
    }

    return result;
  }
}
