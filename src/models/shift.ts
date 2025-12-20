import type { CourseDB, ShiftDB } from "@/server/db/schema";
import type { AttendanceStatus } from "./interfaces";
import { type EmbeddedClass } from "./class";
import { getEmbeddedUser, type User } from "./user";
import { getEmbeddedVolunteer, type Volunteer } from "./volunteer";

export type ShiftAttendance = {
  shiftId: string;
  volunteerUserId: string;
  status: AttendanceStatus;
  checkedInAt: Date | null;
  minutesWorked?: number | null;
};

// Keep the status loose enough to mirror DB enum without breaking callers.
export type ShiftCoverageStatus = "open" | "withdrawn" | "resolved" | string;

export type ShiftCoverage = {
  id: string;
  shiftId: string;
  status: ShiftCoverageStatus;
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
  status: ShiftCoverageStatus;
  category?: string;
  requestingVolunteer: ReturnType<typeof getEmbeddedVolunteer>;
  coveredByVolunteer?: ReturnType<typeof getEmbeddedVolunteer> | null;
};

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

export function getListShift(s: Shift) {
  return {
    id: s.id,
    date: s.date,
    startAt: s.startAt,
    endAt: s.endAt,
    canceled: s.canceled,
    className: s.class.name,
    classDescription: s.class.description,
  } as const;
}

export function getListShiftWithPersonalStatus(
  s: Shift,
  viewerVolunteerUserId: string,
) {
  const personalVolunteer = s.volunteers.find(
    (volunteer) => volunteer.id === viewerVolunteerUserId,
  );
  const personalCoverage = s.coverageRequests.find(
    (coverage) =>
      coverage.requestingVolunteer.id === viewerVolunteerUserId ||
      coverage.coveredByVolunteer?.id === viewerVolunteerUserId,
  );

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
    id: s.id,
    date: s.date,
    startAt: s.startAt,
    endAt: s.endAt,
    canceled: s.canceled,
    cancelledByUser: s.cancelledByUser,
    cancelReason: s.cancelReason,
    canceledAt: s.canceledAt,
    class: s.class,
    instructors: s.instructors.map(getEmbeddedUser),
    volunteers: s.volunteers.map((volunteer) => ({
      ...getEmbeddedVolunteer(volunteer),
      coveringFor: volunteer.coveringFor
        ? getEmbeddedVolunteer(volunteer.coveringFor)
        : undefined,
    })),
  } as const;
}

export function getSingleShiftWithPersonalContext(
  s: Shift,
  viewerVolunteerUserId: string,
) {
  return {
    id: s.id,
    date: s.date,
    startAt: s.startAt,
    endAt: s.endAt,
    canceled: s.canceled,
    cancelledByUser: s.cancelledByUser,
    cancelReason: s.cancelReason,
    canceledAt: s.canceledAt,
    class: s.class,
    instructors: s.instructors.map(getEmbeddedUser),
    volunteers: s.volunteers.map((volunteer) => ({
      ...getEmbeddedVolunteer(volunteer),
      coveringFor: volunteer.coveringFor
        ? getEmbeddedVolunteer(volunteer.coveringFor)
        : undefined,
      attendance:
        volunteer.id === viewerVolunteerUserId
          ? getAttendanceSummary(volunteer.attendance)
          : undefined,
    })),
    coverageRequests: s.coverageRequests
      .filter(
        (coverage) =>
          coverage.requestingVolunteer.id === viewerVolunteerUserId ||
          coverage.coveredByVolunteer?.id === viewerVolunteerUserId,
      )
      .map(getCoverageSummary),
  } satisfies SingleShiftWithPersonalContext;
}

export function getSingleShiftWithRosterContext(s: Shift) {
  return {
    id: s.id,
    date: s.date,
    startAt: s.startAt,
    endAt: s.endAt,
    canceled: s.canceled,
    cancelledByUser: s.cancelledByUser,
    cancelReason: s.cancelReason,
    canceledAt: s.canceledAt,
    class: s.class,
    instructors: s.instructors.map(getEmbeddedUser),
    volunteers: s.volunteers.map((volunteer) => ({
      ...getEmbeddedVolunteer(volunteer),
      coveringFor: volunteer.coveringFor
        ? getEmbeddedVolunteer(volunteer.coveringFor)
        : undefined,
      attendance: getAttendanceSummary(volunteer.attendance) ?? null,
    })),
    coverageRequests: s.coverageRequests.map(getCoverageSummary),
  } satisfies SingleShiftWithRosterContext;
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
  volunteers: Array<
    ReturnType<typeof getEmbeddedVolunteer> & {
      coveringFor?: ReturnType<typeof getEmbeddedVolunteer>;
      attendance?: ShiftAttendanceSummary;
    }
  >;
  coverageRequests: ShiftCoverageSummary[];
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
