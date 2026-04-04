import type { Role } from "@/models/interfaces";

export type NotificationChannel = "email" | "in_app" | "push";

export type ChannelDefaults = Partial<Record<NotificationChannel, boolean>>;

export type Audience =
  | { kind: "user"; userId: string }
  | { kind: "users"; userIds: string[] }
  | { kind: "role"; role: Role }
  | { kind: "shift"; shiftId: string }
  | { kind: "class"; classId: string };

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NotificationTypeDefinition<
  TContext extends {} = Record<string, unknown>,
> {
  key: string;
  label: string;
  description: string | Partial<Record<Role, string>>;
  applicableRoles: Role[];
  channelDefaults: ChannelDefaults;
  title: (ctx: TContext) => string;
  body: (ctx: TContext) => string;
  linkUrl?: (ctx: TContext) => string;
  sourceType?: string;
  sourceId?: (ctx: TContext) => string;
  renderEmail?: (ctx: TContext) => Promise<{ html: string; text: string }>;
}

export interface NotifyParams {
  type: string;
  audience: Audience | Audience[];
  context: Record<string, unknown>;
  actorId?: string;
  deliverAt?: Date;
  idempotencyKey?: string;
  excludeUserIds?: string[];
}

export interface EffectivePreference {
  type: string;
  label: string;
  description: string;
  channel: NotificationChannel;
  enabled: boolean;
  isOverride: boolean;
}
