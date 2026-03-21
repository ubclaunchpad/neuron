import type { NotificationTypeDefinition } from "./types";
import { renderShiftCancelled } from "@/server/emails/templates/shift-cancelled";
import { renderCoverageRequested } from "@/server/emails/templates/coverage-requested";
import { renderCoverageAvailable } from "@/server/emails/templates/coverage-available";
import { renderShiftReminder } from "@/server/emails/templates/shift-reminder";
import { renderShiftNoCheckin } from "@/server/emails/templates/shift-no-checkin";
import { renderCoverageFilled } from "@/server/emails/templates/coverage-filled";
import { renderCoverageFilledPersonal } from "@/server/emails/templates/coverage-filled-personal";

export interface ShiftCancelledContext {
  shiftId: string;
  className: string;
  shiftDate: string;
  cancelReason: string;
  cancelledByName: string;
}

export interface CoverageRequestedContext {
  coverageRequestId: string;
  shiftId: string;
  className: string;
  shiftDate: string;
  requestingVolunteerName: string;
  reason: string;
}

export interface CoverageAvailableContext {
  coverageRequestId: string;
  shiftId: string;
  className: string;
  shiftDate: string;
}

export interface ShiftReminderContext {
  shiftId: string;
  className: string;
  shiftDate: string;
  shiftTime: string;
}

export interface ShiftNoCheckinContext {
  shiftId: string;
  className: string;
  shiftDate: string;
  volunteerNames: string;
  volunteerCount: number;
}

export interface CoverageFilledContext {
  coverageRequestId: string;
  shiftId: string;
  className: string;
  shiftDate: string;
  coveredByVolunteerName: string;
  requestingVolunteerName: string;
}

export interface CoverageFilledPersonalContext {
  coverageRequestId: string;
  shiftId: string;
  className: string;
  shiftDate: string;
  coveredByVolunteerName: string;
}

export const notificationTypes = {
  "shift.cancelled": {
    key: "shift.cancelled",
    label: "Shift cancellations",
    description: {
      admin: "Get notified when any shift is cancelled across the program",
      instructor:
        "Get notified when a shift you're instructing is cancelled",
      volunteer:
        "Get notified when a shift you're assigned to is cancelled",
    },
    applicableRoles: ["admin", "volunteer", "instructor"],
    channelDefaults: { email: true, in_app: true },
    title: (ctx) => `Shift Cancelled: ${ctx.className}`,
    body: (ctx) =>
      `The shift on ${ctx.shiftDate} for ${ctx.className} has been cancelled. Reason: ${ctx.cancelReason}`,
    linkUrl: (ctx) => `/schedule?shiftId=${ctx.shiftId}`,
    sourceType: "shift",
    sourceId: (ctx) => ctx.shiftId,
    renderEmail: (ctx) =>
      renderShiftCancelled({
        className: ctx.className,
        shiftDate: ctx.shiftDate,
        cancelReason: ctx.cancelReason,
        cancelledByName: ctx.cancelledByName,
      }),
  } satisfies NotificationTypeDefinition<ShiftCancelledContext>,

  "coverage.requested": {
    key: "coverage.requested",
    label: "Coverage requests",
    description: {
      admin:
        "Get notified when any volunteer requests coverage for a shift",
      instructor:
        "Get notified when a volunteer requests coverage for one of your classes",
    },
    applicableRoles: ["admin", "instructor"],
    channelDefaults: { email: true, in_app: true },
    title: (ctx) => `Coverage Needed: ${ctx.className}`,
    body: (ctx) =>
      `${ctx.requestingVolunteerName} is requesting coverage for ${ctx.className} on ${ctx.shiftDate}.`,
    linkUrl: (ctx) => `/coverage?requestId=${ctx.coverageRequestId}`,
    sourceType: "coverageRequest",
    sourceId: (ctx) => ctx.coverageRequestId,
    renderEmail: (ctx) =>
      renderCoverageRequested({
        className: ctx.className,
        shiftDate: ctx.shiftDate,
        requestingVolunteerName: ctx.requestingVolunteerName,
        reason: ctx.reason,
      }),
  } satisfies NotificationTypeDefinition<CoverageRequestedContext>,

  "coverage.available": {
    key: "coverage.available",
    label: "Coverage opportunities",
    description:
      "Get notified when a shift you're eligible for needs coverage",
    applicableRoles: ["volunteer"],
    channelDefaults: { email: true, in_app: true },
    title: (ctx) => `Coverage Opportunity: ${ctx.className}`,
    body: (ctx) =>
      `A shift for ${ctx.className} on ${ctx.shiftDate} needs coverage.`,
    linkUrl: (ctx) => `/coverage?requestId=${ctx.coverageRequestId}`,
    sourceType: "coverageRequest",
    sourceId: (ctx) => ctx.coverageRequestId,
    renderEmail: (ctx) =>
      renderCoverageAvailable({
        className: ctx.className,
        shiftDate: ctx.shiftDate,
        coverageRequestId: ctx.coverageRequestId,
      }),
  } satisfies NotificationTypeDefinition<CoverageAvailableContext>,

  "shift.reminder": {
    key: "shift.reminder",
    label: "Shift reminders",
    description:
      "Get a reminder 1 hour before your upcoming shifts",
    applicableRoles: ["volunteer"],
    channelDefaults: { email: true, in_app: true },
    title: (ctx) => `Shift Reminder: ${ctx.className}`,
    body: (ctx) =>
      `Your shift for ${ctx.className} starts at ${ctx.shiftTime} on ${ctx.shiftDate}.`,
    linkUrl: (ctx) => `/schedule?shiftId=${ctx.shiftId}`,
    sourceType: "shift",
    sourceId: (ctx) => ctx.shiftId,
    renderEmail: (ctx) =>
      renderShiftReminder({
        className: ctx.className,
        shiftDate: ctx.shiftDate,
        shiftTime: ctx.shiftTime,
        shiftId: ctx.shiftId,
      }),
  } satisfies NotificationTypeDefinition<ShiftReminderContext>,

  "shift.no-checkin": {
    key: "shift.no-checkin",
    label: "Missed check-ins",
    description:
      "Get notified when volunteers don't check in for their scheduled shift",
    applicableRoles: ["admin"],
    channelDefaults: { email: true, in_app: true },
    title: (ctx) => `Missed Check-in: ${ctx.className}`,
    body: (ctx) =>
      `${ctx.volunteerCount} volunteer${ctx.volunteerCount !== 1 ? "s" : ""} did not check in for ${ctx.className} on ${ctx.shiftDate}: ${ctx.volunteerNames}`,
    linkUrl: (ctx) => `/schedule?shiftId=${ctx.shiftId}`,
    sourceType: "shift",
    sourceId: (ctx) => ctx.shiftId,
    renderEmail: (ctx) =>
      renderShiftNoCheckin({
        className: ctx.className,
        shiftDate: ctx.shiftDate,
        volunteerNames: ctx.volunteerNames,
        volunteerCount: ctx.volunteerCount,
      }),
  } satisfies NotificationTypeDefinition<ShiftNoCheckinContext>,

  "coverage.filled": {
    key: "coverage.filled",
    label: "Coverage updates",
    description: {
      admin:
        "Get notified when a volunteer picks up an open coverage request",
      instructor:
        "Get notified when coverage is filled for one of your classes",
    },
    applicableRoles: ["admin", "instructor"],
    channelDefaults: { email: true, in_app: true },
    title: (ctx) => `Coverage Filled: ${ctx.className}`,
    body: (ctx) =>
      `${ctx.coveredByVolunteerName} has picked up the shift for ${ctx.className} on ${ctx.shiftDate} (originally requested by ${ctx.requestingVolunteerName}).`,
    linkUrl: (ctx) => `/coverage?requestId=${ctx.coverageRequestId}`,
    sourceType: "coverageRequest",
    sourceId: (ctx) => ctx.coverageRequestId,
    renderEmail: (ctx) =>
      renderCoverageFilled({
        className: ctx.className,
        shiftDate: ctx.shiftDate,
        coveredByVolunteerName: ctx.coveredByVolunteerName,
        requestingVolunteerName: ctx.requestingVolunteerName,
      }),
  } satisfies NotificationTypeDefinition<CoverageFilledContext>,

  "coverage.filled-personal": {
    key: "coverage.filled-personal",
    label: "Your coverage requests",
    description:
      "Get notified when another volunteer picks up a shift you requested coverage for",
    applicableRoles: ["volunteer"],
    channelDefaults: { email: true, in_app: true },
    title: (ctx) => `Your Coverage Request Was Filled: ${ctx.className}`,
    body: (ctx) =>
      `Good news! ${ctx.coveredByVolunteerName} has picked up your shift for ${ctx.className} on ${ctx.shiftDate}. You no longer need to attend this shift.`,
    linkUrl: (ctx) => `/coverage?requestId=${ctx.coverageRequestId}`,
    sourceType: "coverageRequest",
    sourceId: (ctx) => ctx.coverageRequestId,
    renderEmail: (ctx) =>
      renderCoverageFilledPersonal({
        className: ctx.className,
        shiftDate: ctx.shiftDate,
        coveredByVolunteerName: ctx.coveredByVolunteerName,
      }),
  } satisfies NotificationTypeDefinition<CoverageFilledPersonalContext>,
} as const;

export type NotificationType = keyof typeof notificationTypes;

export const getNotificationTypeDefinition = (
  type: string,
): NotificationTypeDefinition | undefined => {
  if (!(type in notificationTypes)) return undefined;
  // Each registry entry is a NotificationTypeDefinition<SpecificContext>, which
  // is structurally compatible when the context arg is Record<string, unknown>.
  // The cast is safe because _processNotification always passes the context
  // that the NotificationEventService assembled for this specific type.
  return notificationTypes[type as NotificationType] as unknown as
    | NotificationTypeDefinition
    | undefined;
};

export const allNotificationTypes = Object.keys(
  notificationTypes,
) as NotificationType[];
