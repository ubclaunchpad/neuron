import type { ScheduleShift } from "@/components/schedule/shift-card";
import type { RouterOutputs } from "@/trpc/client";

type ListShift = RouterOutputs["shift"]["list"]["shifts"][number];

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

export function mapListShiftToScheduleShift(shift: ListShift): ScheduleShift {
  const start = toDate(shift.startAt);
  const end = toDate(shift.endAt);

  const personalAttendance =
    "attendance" in shift && !Array.isArray((shift as any).attendance)
      ? (shift as any).attendance
      : undefined;

  const coverageRequest =
    "coverageRequest" in shift ? (shift as any).coverageRequest : undefined;
  const coverageRequests = Array.isArray((shift as any).coverageRequests)
    ? ((shift as any).coverageRequests as Array<{ status?: string }>)
    : undefined;

  let status: ScheduleShift["status"] = "upcoming";

  if (personalAttendance?.checkedInAt) {
    status = "checked_in";
  } else if (coverageRequest?.status === "open") {
    status = "requesting_coverage";
  } else if (coverageRequests?.some((c) => c?.status === "open")) {
    status = "needs_coverage";
  }

  const isMine = Boolean(personalAttendance || coverageRequest);

  return {
    id: shift.id,
    title:
      "className" in shift && shift.className
        ? shift.className
        : "class" in shift && (shift as any).class?.name
          ? (shift as any).class.name
          : "Shift",
    description:
      "classDescription" in shift && shift.classDescription
        ? (shift.classDescription ?? undefined)
        : "class" in shift && (shift as any).class?.description
          ? ((shift as any).class.description ?? undefined)
          : undefined,
    location: undefined,
    start: start.toISOString(),
    end: end.toISOString(),
    status,
    isMine,
    action: undefined,
    accent: undefined,
  };
}
