import type { CourseDB, ShiftDB } from "@/server/db/schema";
import type { AttendanceStatus } from "./interfaces";
import { type EmbeddedClass } from "./class";
import { getEmbeddedUser, type User } from "./user";
import { getEmbeddedVolunteer, type Volunteer } from "./volunteer";
import {
  CoverageStatus,
  type CoverageStatus as CoverageStatusType,
} from "./api/coverage";
import { StringEnum } from "@/lib/base-enum";
import z from "zod";

export const ShiftStatusEnum = z.enum([
  "scheduled",
  "inprogress",
  "cancelled",
  "finished",
] as const);
export type ShiftStatus = z.infer<typeof ShiftStatusEnum>;
export const ShiftStatus = StringEnum.createFromType<ShiftStatus>({
  scheduled: "Upcoming",
  inprogress: "In Progress",
  cancelled: "Cancelled",
  finished: "Complete",
});

export type ShiftAttendance = {
  shiftId: string;
  volunteerUserId: string;
  status: AttendanceStatus;
  checkedInAt: Date | null;
  minutesWorked?: number | null;
};

export type ShiftCoverage = {
  id: string;
  shiftId: string;
  status: CoverageStatusType;
  requestingVolunteer: Volunteer;
  coveredByVolunteer?: Volunteer | null;
  category?: string;
  details?: string;
  comments?: string | null;
};

export type ShiftVolunteer = Volunteer & {
  attendance?: ShiftAttendance | null;
  coveringFor?: Volunteer | null;
};

export type Shift = {
  id: string;
  date: string;
  startAt: Date;
  endAt: Date;
  canceled: boolean;
  status: ShiftStatus;
  cancelledByUser?: User;
  cancelReason?: string;
  canceledAt?: Date;
  class: EmbeddedClass;
  instructors: User[];
  volunteers: ShiftVolunteer[];
  coverageRequests: ShiftCoverage[];
};

export type ShiftAttendanceSummary = {
  shiftId: string;
  volunteerUserId: string;
  status: AttendanceStatus;
  checkedInAt: Date | null;
  minutesWorked?: number | null;
};

export type ShiftCoverageSummary = {
  id: string;
  status: CoverageStatusType;
  category?: string;
  requestingVolunteer: ReturnType<typeof getEmbeddedVolunteer>;
  coveredByVolunteer?: ReturnType<typeof getEmbeddedVolunteer> | null;
};

const coverageStatusPriority: Record<CoverageStatusType, number> = {
  [CoverageStatus.open]: 0,
  [CoverageStatus.resolved]: 1,
  [CoverageStatus.withdrawn]: 2,
};

function getPersonalCoverage(
  s: Shift,
  viewerVolunteerUserId: string,
): ShiftCoverage | undefined {
  const relevantRequests = s.coverageRequests.filter(
    (coverage) =>
      coverage.requestingVolunteer.id === viewerVolunteerUserId ||
      coverage.coveredByVolunteer?.id === viewerVolunteerUserId,
  );

  return relevantRequests
    .slice()
    .sort(
      (a, b) =>
        coverageStatusPriority[a.status] - coverageStatusPriority[b.status],
    )[0];
}

export function buildShift(
  shiftDB: ShiftDB,
  classDB: CourseDB,
  cancelledByUser?: User,
  instructors: User[] = [],
  volunteers: ShiftVolunteer[] = [],
  coverageRequests: ShiftCoverage[] = [],
): Shift {
  return {
    id: shiftDB.id,
    date: shiftDB.date,
    startAt: shiftDB.startAt,
    endAt: shiftDB.endAt,
    canceled: shiftDB.canceled,
    status: getShiftStatus(shiftDB),
    cancelledByUser: cancelledByUser,
    cancelReason: shiftDB.cancelReason ?? undefined,
    canceledAt: shiftDB.canceledAt ?? undefined,
    class: {
      id: classDB.id,
      name: classDB.name,
      termId: classDB.termId,
      image: classDB.image ?? null,
      description: classDB.description ?? null,
      meetingURL: classDB.meetingURL ?? null,
      category: classDB.category,
      subcategory: classDB.subcategory ?? null,
    },
    instructors,
    volunteers,
    coverageRequests,
  } as const;
}

function getShiftStatus(
  shift: { canceled: boolean; startAt: Date; endAt: Date },
  now: Date = new Date(),
): ShiftStatus {
  if (shift.canceled) return ShiftStatus.cancelled;
  if (now >= shift.endAt) return ShiftStatus.finished;
  if (now >= shift.startAt) return ShiftStatus.inprogress;
  return ShiftStatus.scheduled;
}

function getAttendanceSummary(
  attendance?: ShiftAttendance | null,
): ShiftAttendanceSummary | undefined {
  if (!attendance) return undefined;

  return {
    shiftId: attendance.shiftId,
    volunteerUserId: attendance.volunteerUserId,
    status: attendance.status,
    checkedInAt: attendance.checkedInAt,
    minutesWorked: attendance.minutesWorked ?? undefined,
  };
}

function getCoverageSummary(coverage: ShiftCoverage): ShiftCoverageSummary {
  return {
    id: coverage.id,
    status: coverage.status,
    category: coverage.category,
    requestingVolunteer: getEmbeddedVolunteer(coverage.requestingVolunteer),
    coveredByVolunteer: coverage.coveredByVolunteer
      ? getEmbeddedVolunteer(coverage.coveredByVolunteer)
      : null,
  } as const;
}

function getShiftCore(s: Shift) {
  return {
    id: s.id,
    date: s.date,
    startAt: s.startAt,
    endAt: s.endAt,
    canceled: s.canceled,
    status: s.status,
  } as const;
}

function getShiftClassSummary(s: Shift) {
  return {
    className: s.class.name,
    classDescription: s.class.description,
  } as const;
}

function getSingleShiftBase(s: Shift) {
  return {
    ...getShiftCore(s),
    ...getShiftClassSummary(s),
    cancelledByUser: s.cancelledByUser,
    cancelReason: s.cancelReason,
    canceledAt: s.canceledAt,
    class: s.class,
    instructors: s.instructors.map(getEmbeddedUser),
  } as const;
}

function getSingleShiftVolunteer(volunteer: ShiftVolunteer) {
  return {
    ...getEmbeddedVolunteer(volunteer),
    coveringFor: volunteer.coveringFor
      ? getEmbeddedVolunteer(volunteer.coveringFor)
      : undefined,
  } as const;
}

export function getListShift(s: Shift) {
  return {
    ...getShiftCore(s),
    ...getShiftClassSummary(s),
  } as const;
}

export function getListShiftWithPersonalStatus(
  s: Shift,
  viewerVolunteerUserId: string,
) {
  const personalVolunteer = s.volunteers.find(
    (volunteer) => volunteer.id === viewerVolunteerUserId,
  );
  const personalCoverage = getPersonalCoverage(s, viewerVolunteerUserId);

  return {
    ...getListShift(s),
    attendance: getAttendanceSummary(personalVolunteer?.attendance),
    coverageRequest: personalCoverage
      ? getCoverageSummary(personalCoverage)
      : undefined,
  } satisfies ListShiftWithPersonalStatus;
}

export function getListShiftWithRosterStatus(s: Shift) {
  return {
    ...getListShift(s),
    attendance: s.volunteers.map((volunteer) => ({
      volunteer: getEmbeddedVolunteer(volunteer),
      attendance: getAttendanceSummary(volunteer.attendance) ?? null,
    })),
    coverageRequests: s.coverageRequests.map(getCoverageSummary),
  } satisfies ListShiftWithRosterStatus;
}

export function getSingleShift(s: Shift) {
  return {
    ...getSingleShiftBase(s),
    volunteers: s.volunteers.map(getSingleShiftVolunteer),
  } as const;
}

export function getSingleShiftWithPersonalContext(
  s: Shift,
  viewerVolunteerUserId: string,
) {
  const personalVolunteer = s.volunteers.find(
    (volunteer) => volunteer.id === viewerVolunteerUserId,
  );
  const personalCoverage = getPersonalCoverage(s, viewerVolunteerUserId);
  return {
    ...getSingleShift(s),
    attendance: getAttendanceSummary(personalVolunteer?.attendance),
    coverageRequest: personalCoverage
      ? getCoverageSummary(personalCoverage)
      : undefined,
  } satisfies SingleShiftWithPersonalContext;
}

export function getSingleShiftWithRosterContext(s: Shift) {
  return {
    ...getSingleShiftBase(s),
    volunteers: s.volunteers.map((volunteer) => ({
      ...getSingleShiftVolunteer(volunteer),
      attendance: getAttendanceSummary(volunteer.attendance) ?? null,
    })),
    coverageRequests: s.coverageRequests.map(getCoverageSummary),
  } satisfies SingleShiftWithRosterContext;
}

export type EmbeddedShift = {
  id: string;
  date: string;
  startAt: Date;
  endAt: Date;
  class: EmbeddedClass;
  instructors: User[];
};

export function getEmbeddedShift(s: {
  id: string;
  date: string;
  startAt: Date;
  endAt: Date;
  class: EmbeddedClass;
  instructors: User[];
}): EmbeddedShift {
  return {
    id: s.id,
    date: s.date,
    startAt: s.startAt,
    endAt: s.endAt,
    class: s.class,
    instructors: s.instructors,
  };
}

export type ListShift = ReturnType<typeof getListShift>;
export type ListShiftWithPersonalStatus = ListShift & {
  attendance?: ShiftAttendanceSummary;
  coverageRequest?: ShiftCoverageSummary;
};
export type ListShiftWithRosterStatus = ListShift & {
  attendance: {
    volunteer: ReturnType<typeof getEmbeddedVolunteer>;
    attendance: ShiftAttendanceSummary | null;
  }[];
  coverageRequests: ShiftCoverageSummary[];
};

export type SingleShift = ReturnType<typeof getSingleShift>;
export type SingleShiftWithPersonalContext = SingleShift & {
  attendance?: ShiftAttendanceSummary;
  coverageRequest?: ShiftCoverageSummary;
};
export type SingleShiftWithRosterContext = SingleShift & {
  volunteers: Array<
    ReturnType<typeof getEmbeddedVolunteer> & {
      coveringFor?: ReturnType<typeof getEmbeddedVolunteer>;
      attendance: ShiftAttendanceSummary | null;
    }
  >;
  coverageRequests: ShiftCoverageSummary[];
};
