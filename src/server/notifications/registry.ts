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
