# Notification & Event System Implementation Plan

## Context

The codebase currently has a pgBoss-based job system (`jobService`) with one registered job, an email service, and a placeholder "Notifications coming soon..." settings page. We need a unified notification/event system that:

1. Provides a stable API for triggering notifications from domain events (shift cancellations, coverage requests, etc.)
2. **Persists every notification** to a database table so they can be displayed and filtered on the frontend
3. Delivers notifications via channels (email now, push later) respecting user preferences
4. Uses event-level jobs (one pgBoss job per event, not per recipient) that resolve recipients + preferences at execution time

## Service Architecture (3 services)

The system is split across three services with clear responsibilities:

```
Entity Services (shiftService, coverageService, ...)
       │
       │  call typed methods like notifyShiftCancelled(...)
       ▼
┌─────────────────────────────┐
│  NotificationEventService   │  ← Event surface: typed domain methods, owns copywriting,
│  (the public API for        │    audience selection, and context mapping
│   triggering notifications) │
└──────────────┬──────────────┘
               │  calls notify({ type, audience, context, ... })
               ▼
┌─────────────────────────────┐
│  NotificationService        │  ← Core engine: job dispatch, audience resolution,
│  (generic notification      │    preference checking, persistence, email delivery,
│   dispatch + queries)       │    frontend queries (list, unread count, mark read)
└─────────────────────────────┘
               │  reads preferences from
               ▼
┌─────────────────────────────┐
│  PreferenceService          │  ← Preferences: CRUD for user overrides,
│  (notification preferences) │    effective preference resolution (registry defaults
│                             │    + user overrides), used by tRPC router + engine
└─────────────────────────────┘
```

**Why this split?**
- **NotificationEventService** — Entity services call `this.notificationEventService.notifyShiftCancelled({ shiftId, cancelReason })` with just domain data. All copywriting (title, body), audience selection, source mapping, and idempotency key generation live here, not scattered across entity services. Adding a new notification = adding one method here + a registry entry.
- **NotificationService** — Generic engine. Doesn't know about shifts or coverage. Takes `{ type, audience, context }` and handles job dispatch, audience resolution, preference checking, persistence, and email delivery. Also serves frontend queries (list, unread count, mark read).
- **PreferenceService** — Owns the `notification_preference` table. Provides CRUD for user overrides and `getEffectivePreferences()` that merges registry defaults with user overrides. Used by both the notification engine (at delivery time) and the tRPC router (for the settings UI).

---

## Step 1: Database Schema

**New file: `src/server/db/schema/notification.ts`**

Two tables:

### `notification` table (persisted events for frontend + audit)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `defaultRandom()` |
| `userId` | uuid FK → user | recipient, `onDelete: cascade` |
| `type` | text | notification type key e.g. `"shift.cancelled"` |
| `title` | text | rendered title |
| `body` | text | rendered body |
| `linkUrl` | text? | deep link e.g. `/shifts/{id}` |
| `sourceType` | text? | `"shift"`, `"coverageRequest"`, etc. |
| `sourceId` | uuid? | ID of source entity |
| `actorId` | uuid? FK → user | who triggered it, `onDelete: set null` |
| `read` | boolean | default `false` |
| `readAt` | timestamp? | when marked read |
| `emailSent` | boolean | default `false`, tracks if email was dispatched |
| `createdAt` | timestamp | `defaultNow()` |
| `idempotencyKey` | text? | unique, prevents duplicate notifications |

Indexes: `(userId, createdAt)`, `(userId, read)`, `(type)`, `(sourceType, sourceId)`

### `notification_preference` table (override-only)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `defaultRandom()` |
| `userId` | uuid FK → user | `onDelete: cascade` |
| `type` | text | notification type key |
| `channel` | enum(`email`, `in_app`, `push`) | channel being overridden |
| `enabled` | boolean | override value |
| `updatedAt` | timestamp | `defaultNow()` |

Unique constraint on `(userId, type, channel)`. Index on `(userId)`.

**Modify: `src/server/db/schema/index.ts`** — add `export * from "./notification"`

**Generate migration** via `drizzle-kit generate`

---

## Step 2: Notification Type Registry

**New file: `src/server/notifications/types.ts`**

Core type definitions:
- `NotificationChannel = "email" | "in_app" | "push"`
- `Audience` union type: `{ kind: "user", userId }` | `{ kind: "users", userIds }` | `{ kind: "role", role }` | `{ kind: "shift", shiftId }` | `{ kind: "class", classId }`
- `NotificationTypeDefinition<TContext>` — defines per-type: `key`, `channelDefaults`, `title(ctx)`, `body(ctx)`, `linkUrl?(ctx)`, `sourceType?`, `sourceId?(ctx)`, `emailTemplate?(ctx)`

**New file: `src/server/notifications/registry.ts`**

A plain object mapping type keys to their definitions. Start with two types:

- **`shift.cancelled`** — defaults: `{ email: true, in_app: true }`. Title/body reference class name, date, reason. Source: shift.
- **`coverage.requested`** — defaults: `{ email: true, in_app: true }`. Title/body reference volunteer name, class, date. Source: coverageRequest.

Adding new notification types = adding an entry here + a method on `NotificationEventService`.

---

## Step 3: PreferenceService

**New file: `src/server/services/preferenceService.ts`**

Public interface (`IPreferenceService`):

```
// For settings UI (tRPC router)
getEffectivePreferences(userId): Promise<EffectivePreference[]>
  // merges registry defaults + user overrides for all types/channels

setPreference({ userId, type, channel, enabled }): Promise<void>
clearPreference({ userId, type, channel }): Promise<void>

// For notification engine (bulk resolution at delivery time)
getPreferencesForRecipients({ type, userIds }): Promise<Map<string, Map<channel, boolean>>>
  // SELECT * FROM notification_preference WHERE userId IN (...) AND type = ?
  // overlay onto registry defaults, return effective per-user/per-channel map
```

**DI dependencies**: `{ db }`

### Preference resolution logic
1. Load all override rows for the given userIds + type
2. For each user, for each channel defined in the registry type: check override → fall back to registry default
3. Return a `Map<userId, Map<channel, enabled>>` for the engine to consume

### `EffectivePreference` shape (for settings UI)
```ts
{ type: string; channel: NotificationChannel; enabled: boolean; isOverride: boolean }
```
`isOverride: true` means the user has explicitly set this, `false` means it's the registry default. The UI can use this to show a "reset to default" action.

---

## Step 4: NotificationService (core engine)

**New file: `src/server/services/notificationService.ts`**

Public interface (`INotificationService`):

```
// Dispatch — enqueues a pgBoss job
notify({ type, audience, context, actorId?, deliverAt?, idempotencyKey? }): Promise<string | null>

// Cancel a scheduled notification
cancel(idempotencyKey): Promise<void>

// Frontend queries
getNotifications({ userId, type?, read?, limit?, cursor? }): Promise<{ items, nextCursor }>
getUnreadCount(userId): Promise<number>
markAsRead(notificationId, userId): Promise<void>
markAllAsRead(userId): Promise<void>

// Internal — called by job handler only
_processNotification({ type, audience, context, actorId?, idempotencyKey? }): Promise<void>
```

**DI dependencies**: `{ db, jobService, emailService, preferenceService }`

### `notify()` implementation
- Serializes `{ type, audience, context, actorId, idempotencyKey }` as job payload
- Calls `jobService.run("jobs.process-notification", payload, { startAfter: deliverAt, singletonKey: idempotencyKey })`

### `_processNotification()` implementation (called by job handler)
1. Look up type definition from registry
2. Resolve audience → list of `{ userId, email }`:
   - `kind: "user"` → single lookup
   - `kind: "users"` → `WHERE id IN (...)`
   - `kind: "role"` → `WHERE role = ? AND status = 'active'`
   - `kind: "shift"` → join `shiftAttendance` or `volunteerToSchedule` via schedule
   - `kind: "class"` → join `volunteerToSchedule` + `instructorToSchedule` for all schedules under that courseId
3. Call `preferenceService.getPreferencesForRecipients({ type, userIds })` — single bulk query
4. For each recipient, check effective preferences per channel:
   - **in_app channel**: batch `INSERT INTO notification` for all enabled recipients
   - **email channel**: render email template (or fallback to title/body), call `emailService.send()` per enabled recipient
5. Respect `idempotencyKey` — skip if notification row with that key already exists

### `getNotifications()` implementation
- Keyset pagination on `createdAt` (cursor = ISO timestamp)
- Filter by `type`, `read` status
- Always scoped to `userId` (security enforced at service level)

---

## Step 5: NotificationEventService (event surface)

**New file: `src/server/services/notificationEventService.ts`**

This is the **only service that entity services interact with**. It provides typed, domain-specific methods that encapsulate all notification details (copywriting, audience, source mapping). Entity services pass only domain data — they never construct notification titles, bodies, or audience shapes.

Public interface (`INotificationEventService`):

```ts
notifyShiftCancelled(params: {
  shiftId: string;
  className: string;
  shiftDate: string;
  cancelReason: string;
  cancelledByUserId: string;
  cancelledByName: string;
}): Promise<void>;

notifyCoverageRequested(params: {
  coverageRequestId: string;
  shiftId: string;
  classId: string;
  className: string;
  shiftDate: string;
  requestingVolunteerUserId: string;
  requestingVolunteerName: string;
  reason: string;
}): Promise<void>;

// Future methods added here as new notification types are needed:
// notifyShiftReminder(...)
// notifyCoverageFilled(...)
// notifyVolunteerDeactivated(...)
```

**DI dependencies**: `{ notificationService }`

### Implementation pattern (each method follows the same shape)

```ts
async notifyShiftCancelled(params) {
  await this.notificationService.notify({
    type: "shift.cancelled",
    audience: { kind: "shift", shiftId: params.shiftId },
    context: {
      shiftId: params.shiftId,
      className: params.className,
      shiftDate: params.shiftDate,
      cancelReason: params.cancelReason,
      cancelledByName: params.cancelledByName,
    },
    actorId: params.cancelledByUserId,
    idempotencyKey: `shift-cancelled-${params.shiftId}`,
  });
}
```

Each method is responsible for:
- Mapping domain params → the correct notification `type` key
- Choosing the right `audience` shape
- Assembling the `context` object that the registry's title/body functions need
- Setting the `actorId` and `idempotencyKey`

---

## Step 6: pgBoss Job Definition

**New file: `src/server/jobs/definitions/process-notification.job.ts`**

```
name: "jobs.process-notification"
retryOpts: { retryLimit: 3, retryDelay: 30, retryBackoff: true }
handler: calls cradle.notificationService._processNotification(payload)
```

Payload type: `{ type, audience, context, actorId?, idempotencyKey? }`

**Modify: `src/server/jobs/registry.ts`** — add `processNotificationJob` to `allJobs`

---

## Step 7: DI Container Registration

**Modify: `src/server/api/di-container.ts`**

Add to `NeuronCradle`:
```ts
preferenceService: IPreferenceService;
notificationService: INotificationService;
notificationEventService: INotificationEventService;
```

Register:
```ts
preferenceService: asClass(PreferenceService).scoped(),
notificationService: asClass(NotificationService).scoped(),
notificationEventService: asClass(NotificationEventService).scoped(),
```

All scoped — job handler creates a container scope per job execution.

---

## Step 8: tRPC Router

**New file: `src/models/api/notification.ts`** — Zod input schemas for list, preferences

**New file: `src/server/api/routers/notification-router.ts`**

Endpoints:
- `notification.list` — query, paginated list of user's notifications (→ `notificationService.getNotifications`)
- `notification.unreadCount` — query, returns number (→ `notificationService.getUnreadCount`)
- `notification.markAsRead` — mutation, single notification (→ `notificationService.markAsRead`)
- `notification.markAllAsRead` — mutation (→ `notificationService.markAllAsRead`)
- `notification.preferences` — query, returns effective preferences (→ `preferenceService.getEffectivePreferences`)
- `notification.setPreference` — mutation (→ `preferenceService.setPreference`)

All endpoints use `authorizedProcedure()` (no special permission needed — every user can manage their own notifications). User ID always from `currentSessionService.requireUser().id`.

**Modify: `src/server/api/root.ts`** — add `notification: notificationRouter`

---

## Step 9: Entity Service Integration

### `src/server/services/entity/shiftService.ts`
- Add `notificationEventService: INotificationEventService` to constructor deps
- After successful `cancelShift()` (after the update query succeeds), call:
  ```ts
  await this.notificationEventService.notifyShiftCancelled({
    shiftId,
    className: course.name,
    shiftDate: format(shiftRow.startAt),
    cancelReason,
    cancelledByUserId: currentUserId,
    cancelledByName: currentUser.name,
  });
  ```
- Need to fetch course name in the cancel method (add to the existing select or do a follow-up query)

### `src/server/services/entity/coverageService.ts`
- Add `notificationEventService` to constructor deps
- After `requestCoverage()` succeeds, call:
  ```ts
  await this.notificationEventService.notifyCoverageRequested({
    coverageRequestId: newRequest.id,
    shiftId,
    classId: shift.courseId,
    className: course.name,
    shiftDate: format(shift.startAt),
    requestingVolunteerUserId: currentUserId,
    requestingVolunteerName: currentUser.name,
    reason: input.details,
  });
  ```

---

## Step 10: Email Templates

**New file: `src/server/emails/templates/shift-cancelled.tsx`** — React Email template following existing pattern (`EmailLayout` wrapper, `renderEmail()` export)

**New file: `src/server/emails/templates/coverage-requested.tsx`** — same pattern

These get wired into the registry's `emailTemplate` function for each type.

---

## Step 11: Unread Tracking Strategy

Modern platforms (GitHub, Notion, Linear) use **per-notification read state** rather than a global "last seen" timestamp. This gives users fine-grained control (mark individual items read/unread) while still supporting bulk "mark all as read".

### How it works

- Each `notification` row has a `read` boolean (default `false`) and `readAt` timestamp
- **Viewing the dropdown does NOT auto-mark as read** — this matches GitHub/Notion behavior where opening the inbox shows notifications but you explicitly interact to mark them
- **Clicking a notification** marks that single notification as read (sets `read = true`, `readAt = now()`) and navigates to the `linkUrl`
- **"Mark all as read" button** bulk-updates: `UPDATE notification SET read = true, readAt = now() WHERE userId = ? AND read = false`
- **Unread count** query: `SELECT count(*) FROM notification WHERE userId = ? AND read = false` — cached on the frontend with polling

### Why not a "last seen" timestamp approach?
A `lastSeenAt` timestamp (GitHub's older model) is simpler but breaks when a user wants to keep specific notifications unread as reminders. Per-notification state is the standard now and only costs one boolean column we already have.

---

## Step 12: Frontend

### Notification inbox dropdown

**New file: `src/components/notifications/notification-inbox.tsx`**

Placement: In the `SidebarHeader` of `src/components/app-navbar.tsx`, to the left of the existing sidebar toggle button (in the `ml-auto` right-aligned section).

Structure:
```
<DropdownMenu>
  <DropdownMenuTrigger>
    <div className="relative">
      <Inbox className="size-5 text-muted-foreground" />   {/* lucide-react Inbox icon */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500" />  {/* red dot */}
      )}
    </div>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-96">
    <Header>
      <span>Notifications</span>
      <Button variant="ghost" onClick={markAllAsRead}>Mark all as read</Button>
    </Header>
    <ScrollArea className="max-h-96">
      {notifications.map(n => (
        <NotificationItem
          key={n.id}
          notification={n}
          onClick={() => { markAsRead(n.id); navigate(n.linkUrl); }}
        />
      ))}
    </ScrollArea>
  </DropdownMenuContent>
</DropdownMenu>
```

Key behaviors:
- **Red dot indicator** (not a count badge) — small `size-2 rounded-full bg-red-500` circle, visible when `unreadCount > 0`. Matches modern minimal style.
- **Polling for unread count**: `trpc.notification.unreadCount.useQuery()` with `refetchInterval: 30_000` (30s)
- **Notification list in dropdown**: `trpc.notification.list.useQuery({ limit: 20 })` — fetched when dropdown opens
- **Unread items styled differently**: unread notifications get a left blue border or subtle background tint to distinguish from read ones
- **Click behavior**: marks as read + navigates to `linkUrl`
- **Empty state**: "You're all caught up" message when no notifications
- **Invalidation**: After `markAsRead` or `markAllAsRead` mutations, invalidate both `unreadCount` and `list` queries

**New file: `src/components/notifications/notification-item.tsx`**

Single notification row component:
- Actor avatar (small, if actorId present) + title + relative timestamp ("2h ago")
- Body text truncated to 2 lines
- Unread indicator (blue dot or bold title)
- Hover state for interactivity

### Modify: `src/components/app-navbar.tsx`
- Import and render `<NotificationInbox />` in the `SidebarHeader` right-aligned `div`, before the sidebar toggle button
- When sidebar is collapsed to icon mode, the inbox icon should still be visible (use `group-data-[state=collapsed]` classes)

### Notification settings
**Modify: `src/components/settings/pages/notifications-settings-content.tsx`**
- Replace "coming soon" with a real preferences UI
- Table/grid: rows = notification types, columns = channels
- Toggle switches calling `trpc.notification.setPreference.useMutation()`
- Data from `trpc.notification.preferences.useQuery()`
- Show "reset to default" option when `isOverride` is true

---

## File Summary

### New files (13)
| File | Purpose |
|------|---------|
| `src/server/db/schema/notification.ts` | Drizzle schema for notification + notification_preference |
| `src/server/notifications/types.ts` | Type definitions (channels, audiences, type definition shape) |
| `src/server/notifications/registry.ts` | Central registry of notification types with defaults |
| `src/server/services/preferenceService.ts` | Preference CRUD + effective preference resolution |
| `src/server/services/notificationService.ts` | Core engine: dispatch, audience resolution, persistence, queries |
| `src/server/services/notificationEventService.ts` | Event surface: typed domain methods for triggering notifications |
| `src/server/jobs/definitions/process-notification.job.ts` | pgBoss job definition |
| `src/server/api/routers/notification-router.ts` | tRPC router for frontend |
| `src/models/api/notification.ts` | Zod input schemas |
| `src/server/emails/templates/shift-cancelled.tsx` | Email template |
| `src/server/emails/templates/coverage-requested.tsx` | Email template |
| `src/components/notifications/notification-inbox.tsx` | Inbox dropdown with red dot indicator |
| `src/components/notifications/notification-item.tsx` | Single notification row component |

### Modified files (8)
| File | Change |
|------|--------|
| `src/server/db/schema/index.ts` | Export notification schema |
| `src/server/jobs/registry.ts` | Register process-notification job |
| `src/server/api/di-container.ts` | Add 3 new services to cradle + registration |
| `src/server/api/root.ts` | Add notification router |
| `src/server/services/entity/shiftService.ts` | Call `notificationEventService.notifyShiftCancelled(...)` |
| `src/server/services/entity/coverageService.ts` | Call `notificationEventService.notifyCoverageRequested(...)` |
| `src/components/app-navbar.tsx` | Add NotificationInbox to sidebar header |
| `src/components/settings/pages/notifications-settings-content.tsx` | Replace placeholder |

---

## Implementation Order

1. DB schema + migration
2. Notification types + registry
3. PreferenceService
4. NotificationService (core engine)
5. NotificationEventService (event surface)
6. DI container registration (all 3 services)
7. pgBoss job definition + registry update
8. tRPC router + input schemas + root router update
9. Entity service integration (shiftService, coverageService)
10. Email templates
11. Frontend: notification inbox dropdown + notification item components
12. Frontend: wire inbox into app-navbar sidebar header
13. Frontend: notification settings preferences page

---

## Verification

1. **Unit tests**: PreferenceService — test effective preference resolution (defaults, overrides, clearing). NotificationService — mock db/jobService/emailService/preferenceService, test audience resolution, persistence, idempotency. NotificationEventService — mock notificationService, verify correct type/audience/context mapping per method.
2. **Integration tests**: Full flow — cancel a shift → notificationEventService called → pgBoss job fires → notification rows inserted + email sent. Use test container with MockEmailService.
3. **tRPC tests**: List/pagination, mark read, preference CRUD.
4. **Manual**: Cancel a shift in the UI → verify notification appears in DB → verify email received → verify notification shows in frontend inbox.
