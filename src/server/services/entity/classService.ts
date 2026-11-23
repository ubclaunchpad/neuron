import { Temporal } from "@js-temporal/polyfill";
import { and, asc, eq, inArray, SQL } from "drizzle-orm";
import { RRuleTemporal } from "rrule-temporal";

import { NEURON_TIMEZONE } from "@/lib/constants";
import { hasPermission } from "@/lib/auth/extensions/permissions";
import { Role } from "@/models/interfaces";
import type {
  ClassRequest,
  CreateClassOutput,
  UpdateClassOutput,
} from "@/models/api/class";
import {
  ScheduleType,
  type CreateScheduleInput,
  type UpdateScheduleInput,
  type Weekday,
} from "@/models/api/schedule";
import { buildClass, type Class, type ClassResponse } from "@/models/class";
import { buildSchedule, type ScheduleRule } from "@/models/schedule";
import { type Drizzle, type Transaction } from "@/server/db";
import {
  blackout,
  course,
  term,
  instructorToSchedule,
  schedule,
  type ScheduleDB,
  user,
  volunteerToSchedule,
} from "@/server/db/schema";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { toMap, uniqueDefined } from "@/utils/arrayUtils";
import type { ICurrentSessionService } from "@/server/services/currentSessionService";
import type { IImageService } from "../imageService";
import type { CreatedShiftOccurrence, IShiftService } from "./shiftService";
import type { ITermService } from "./termService";
import type { IUserService } from "./userService";
import type { IVolunteerService } from "./volunteerService";
import { tryCatch } from "@/lib/try-catch";

export type ScheduleOccurrence = {
  date: string;
  startAt: string;
  endAt: string;
};

export type ExpandScheduleOccurrencesInput = {
  rule: ScheduleRule;
  durationMinutes: number;
  effectiveStart?: string | null;
  effectiveEnd?: string | null;
  termStartDate: string;
  termEndDate: string;
  blackouts: readonly { startsOn: string; endsOn: string }[];
};

export type PublishClassResult = {
  classId: string;
  status: "published" | "already_published";
  createdShiftCount: number;
};

export type PublishClassOutcome =
  | PublishClassResult
  | {
      classId: string;
      status: "failed";
      error: string;
      errorCode?: string;
    };

export type PublishAllClassesResult = {
  total: number;
  publishedCount: number;
  alreadyPublishedCount: number;
  failedCount: number;
  results: PublishClassOutcome[];
};

const PLACEHOLDER_DATE =
  Temporal.Instant.fromEpochMilliseconds(0).toZonedDateTimeISO("UTC");

function toTemporalZonedDateTime(
  date: string,
  rule: Pick<ScheduleRule, "tzid" | "localStartTime">,
): Temporal.ZonedDateTime {
  return Temporal.PlainDate.from(date).toZonedDateTime({
    timeZone: rule.tzid,
    plainTime: Temporal.PlainTime.from(rule.localStartTime),
  });
}

function buildRRuleFromScheduleRule(rule: ScheduleRule): RRuleTemporal {
  const { hour, minute, second } = Temporal.PlainTime.from(rule.localStartTime);
  const baseRRuleParams = {
    dtstart: PLACEHOLDER_DATE,
    byHour: [hour],
    byMinute: [minute],
    bySecond: [second],
    tzid: rule.tzid,
  };

  switch (rule.type) {
    case "weekly":
      return new RRuleTemporal({
        ...baseRRuleParams,
        freq: "WEEKLY",
        byDay: [rule.weekday],
        interval: rule.interval,
      });
    case "monthly":
      return new RRuleTemporal({
        ...baseRRuleParams,
        freq: "MONTHLY",
        byDay: [rule.weekday],
        bySetPos: [rule.nth],
      });
    case "single":
      return new RRuleTemporal({
        ...baseRRuleParams,
        freq: "YEARLY",
        count: rule.extraDates.length,
        rDate: rule.extraDates.map((date) =>
          toTemporalZonedDateTime(date, rule),
        ),
      });
  }
}

function buildBlackoutDateSet(
  blackouts: readonly { startsOn: string; endsOn: string }[],
  windowStart: Temporal.PlainDate,
  windowEnd: Temporal.PlainDate,
): Set<string> {
  const dates = new Set<string>();
  for (const range of blackouts) {
    const start = Temporal.PlainDate.from(range.startsOn);
    const end = Temporal.PlainDate.from(range.endsOn);
    const clampedStart =
      Temporal.PlainDate.compare(start, windowStart) < 0 ? windowStart : start;
    const clampedEnd =
      Temporal.PlainDate.compare(end, windowEnd) > 0 ? windowEnd : end;

    for (
      let d = clampedStart;
      Temporal.PlainDate.compare(d, clampedEnd) <= 0;
      d = d.add({ days: 1 })
    ) {
      dates.add(d.toString());
    }
  }
  return dates;
}

/**
 * Expands a schedule rule into concrete shift occurrences within its effective
 * date window, excluding blackout dates. Each occurrence is uniquely identified
 * within its schedule by calendar date (`date` in `rule.tzid`).
 */
export function expandScheduleOccurrences(
  input: ExpandScheduleOccurrencesInput,
): ScheduleOccurrence[] {
  const {
    rule,
    durationMinutes,
    effectiveStart,
    effectiveEnd,
    termStartDate,
    termEndDate,
    blackouts,
  } = input;

  // Schedule start/end dates override term start/end dates.
  const startDate = effectiveStart ?? termStartDate;
  const endDate = effectiveEnd ?? termEndDate;
  const startPlainDate = Temporal.PlainDate.from(startDate);
  const endPlainDate = Temporal.PlainDate.from(endDate);

  if (Temporal.PlainDate.compare(endPlainDate, startPlainDate) < 0) {
    return [];
  }

  const blackoutDates = buildBlackoutDateSet(
    blackouts,
    startPlainDate,
    endPlainDate,
  );

  if (rule.type === ScheduleType.single) {
    const uniqueDates = Array.from(
      new Set(
        rule.extraDates
          .map((d) => Temporal.PlainDate.from(d))
          .filter(
            (d) =>
              Temporal.PlainDate.compare(d, startPlainDate) >= 0 &&
              Temporal.PlainDate.compare(d, endPlainDate) <= 0 &&
              !blackoutDates.has(d.toString()),
          )
          .sort(Temporal.PlainDate.compare)
          .map((d) => d.toString()),
      ),
    );

    return uniqueDates.map((date) => {
      const dt = toTemporalZonedDateTime(date, rule);
      return {
        date,
        startAt: dt.toInstant().toString(),
        endAt: dt.add({ minutes: durationMinutes }).toInstant().toString(),
      };
    });
  }

  const dtstart = toTemporalZonedDateTime(startDate, rule);
  const until = toTemporalZonedDateTime(endDate, rule);
  const rrule = buildRRuleFromScheduleRule(rule);
  const exDate = Array.from(blackoutDates, (date) =>
    toTemporalZonedDateTime(date, rule),
  );

  const finishedRule = new RRuleTemporal({
    ...rrule.options(),
    dtstart,
    until,
    exDate,
  });

  const seenDates = new Set<string>();
  const occurrences: ScheduleOccurrence[] = [];

  for (const dt of finishedRule.all()) {
    const date = dt.toPlainDate().toString();
    if (blackoutDates.has(date) || seenDates.has(date)) continue;
    seenDates.add(date);

    occurrences.push({
      date,
      startAt: dt.toInstant().toString(),
      endAt: dt.add({ minutes: durationMinutes }).toInstant().toString(),
    });
  }

  return occurrences;
}

export interface IClassService {
  getClassesForSelect(): Promise<{ id: string; name: string }[]>;
  getClassesForRequest(
    listRequest: ClassRequest,
  ): Promise<ClassResponse<Class>>;
  getClasses(ids: string[]): Promise<Class[]>;
  getClass(id: string): Promise<Class>;
  createClass(classCreate: CreateClassOutput): Promise<string>;
  updateClass(classUpdate: UpdateClassOutput): Promise<void>;
  deleteClass(classId: string): Promise<void>;
  publishClass(classId: string): Promise<PublishClassResult>;
  publishAllClasses(): Promise<PublishAllClassesResult>;
  retrieveFullClasses(input: {
    where: SQL<unknown>;
    withTotalCount?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Class[]>;
}

export class ClassService implements IClassService {
  private readonly db: Drizzle;
  private readonly currentSessionService: ICurrentSessionService;
  private readonly userService: IUserService;
  private readonly volunteerService: IVolunteerService;
  private readonly termService: ITermService;
  private readonly shiftService: IShiftService;
  private readonly imageService: IImageService;

  constructor({
    db,
    currentSessionService,
    userService,
    volunteerService,
    termService,
    shiftService,
    imageService,
  }: {
    db: Drizzle;
    currentSessionService: ICurrentSessionService;
    userService: IUserService;
    volunteerService: IVolunteerService;
    termService: ITermService;
    shiftService: IShiftService;
    imageService: IImageService;
  }) {
    this.db = db;
    this.currentSessionService = currentSessionService;
    this.userService = userService;
    this.volunteerService = volunteerService;
    this.termService = termService;
    this.shiftService = shiftService;
    this.imageService = imageService;
  }

  async getClassesForSelect(): Promise<{ id: string; name: string }[]> {
    let query = this.db
      .select({ id: course.id, name: course.name })
      .from(course)
      .$dynamic();

    if (
      !hasPermission({
        user: this.currentSessionService.getUser(),
        permission: { terms: ["view-unpublished"] },
      })
    ) {
      query = query
        .innerJoin(term, eq(course.termId, term.id))
        .where(eq(term.published, true));
    }

    return query.orderBy(course.name);
  }

  async getClassesForRequest(
    listRequest: ClassRequest,
  ): Promise<ClassResponse<Class>> {
    let termId = listRequest.term;

    // If term is "current", find the current term
    let termData;
    if (termId === "current") {
      termData = await this.termService.getCurrentTerm();

      if (!termData) {
        throw new NeuronError(
          "No current term found",
          NeuronErrorCodes.NOT_FOUND,
        );
      }
    } else {
      termData = await this.termService.getTerm(termId);
    }

    const classes = await this.retrieveFullClasses({
      // Filter by term
      where: eq(course.termId, termData.id),
      withTotalCount: true,
    });

    return {
      classes: classes,
      term: termData,
    };
  }

  async getClasses(ids: string[]): Promise<Class[]> {
    const classes = await this.retrieveFullClasses({
      where: inArray(course.id, ids),
    });

    if (classes.length !== ids.length) {
      const firstMissing = ids.find((id) => !classes.some((d) => d.id === id));
      throw new NeuronError(
        `Could not find Class with id ${firstMissing}`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    return classes;
  }

  async getClass(id: string): Promise<Class> {
    const classes = await this.retrieveFullClasses({
      where: eq(course.id, id),
    });

    if (classes.length !== 1) {
      throw new NeuronError(
        `Could not find Class with id ${id}`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    return classes[0]!;
  }

  async createClass(classCreate: CreateClassOutput): Promise<string> {
    const { schedules, ...dbClassCreate } = classCreate;

    return await this.db.transaction(async (tx: Transaction) => {
      // Insert class itself
      const [row] = await tx
        .insert(course)
        .values(dbClassCreate)
        .returning({ id: course.id });

      // Insert schedules
      await this.insertSchedules(tx, row!.id, schedules);

      return row!.id;
    });
  }

  /**
   * Updates a class and its schedules atomically.
   *
   * Published-occurrence immutability policy:
   * Once a class is published, schedules cannot be added or deleted, and
   * occurrence-defining schedule parameters (`rule`, `localStartTime`,
   * `localEndTime`, `effectiveStart`, `effectiveEnd`) are immutable and
   * rejected with `BAD_REQUEST`. Non-occurrence updates (class metadata,
   * `preferredVolunteerCount`, and volunteer/instructor assignments) remain
   * permitted without rewriting stored recurrence rules or drifting generated
   * shifts and pending notification jobs.
   */
  async updateClass(classUpdate: UpdateClassOutput): Promise<void> {
    const {
      id,
      addedSchedules,
      updatedSchedules,
      deletedSchedules,
      ...dbClassUpdate
    } = classUpdate;

    return await this.db.transaction(async (tx: Transaction) => {
      // Lock the course row so concurrent publishClass and updateClass calls
      // serialize around course.published and schedule mutations.
      const [originalClass] = await tx
        .select()
        .from(course)
        .where(eq(course.id, id))
        .for("update");

      if (!originalClass) {
        throw new NeuronError(
          "Class does not exist",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      const updatedScheduleIds = updatedSchedules.map((s) => s.id);
      const updatedScheduleIdSet = new Set(updatedScheduleIds);
      if (updatedScheduleIdSet.size !== updatedScheduleIds.length) {
        throw new NeuronError(
          "Duplicate schedule IDs in update request.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      const deletedScheduleIdSet = new Set(deletedSchedules);
      if (deletedScheduleIdSet.size !== deletedSchedules.length) {
        throw new NeuronError(
          "Duplicate schedule IDs in delete request.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      for (const scheduleId of deletedScheduleIdSet) {
        if (updatedScheduleIdSet.has(scheduleId)) {
          throw new NeuronError(
            `Schedule with id ${scheduleId} cannot be both updated and deleted.`,
            NeuronErrorCodes.BAD_REQUEST,
          );
        }
      }

      // Validate that all referenced schedule IDs belong to the target class
      // and index originals by ID (never relying on SQL IN result order).
      const referencedScheduleIds = [
        ...updatedScheduleIds,
        ...deletedSchedules,
      ];
      const ownedSchedules =
        referencedScheduleIds.length > 0
          ? await tx
              .select()
              .from(schedule)
              .where(
                and(
                  eq(schedule.courseId, id),
                  inArray(schedule.id, referencedScheduleIds),
                ),
              )
          : [];
      const ownedSchedulesById = new Map(
        ownedSchedules.map((row) => [row.id, row]),
      );

      const invalidScheduleId = referencedScheduleIds.find(
        (scheduleId) => !ownedSchedulesById.has(scheduleId),
      );
      if (invalidScheduleId) {
        throw new NeuronError(
          `Schedule with id ${invalidScheduleId} does not belong to class ${id}.`,
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      // Cannot add, delete, or update occurrence-defining schedule fields once published.
      if (
        originalClass.published &&
        (addedSchedules.length > 0 ||
          deletedSchedules.length > 0 ||
          updatedSchedules.some(
            (s) =>
              s.effectiveEnd !== undefined ||
              s.effectiveStart !== undefined ||
              s.rule !== undefined ||
              s.localStartTime !== undefined ||
              s.localEndTime !== undefined,
          ))
      ) {
        throw new NeuronError(
          "Schedule recurrences and timing cannot be changed for a published class.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      // Update class itself
      if (Object.values(dbClassUpdate).length > 0) {
        const row = await tx
          .update(course)
          .set(dbClassUpdate)
          .where(eq(course.id, id))
          .returning({
            id: course.id,
          });

        if (row.length !== 1) {
          throw new NeuronError(
            "Failed to update Class",
            NeuronErrorCodes.INTERNAL_SERVER_ERROR,
          );
        }
      }

      // Try and clean up image if we deleted it, ignore errors
      const oldImageKey = originalClass.image;
      if (!!oldImageKey && !!dbClassUpdate.image) {
        await tryCatch(this.imageService.deleteImage(oldImageKey));
      }

      // Update schedules
      if (updatedSchedules.length > 0) {
        await this.updateSchedules(
          tx,
          id,
          updatedSchedules,
          ownedSchedulesById,
        );
      }

      // Insert schedules
      if (addedSchedules.length > 0) {
        await this.insertSchedules(tx, id, addedSchedules);
      }

      // Delete schedules
      if (deletedSchedules.length > 0) {
        const deleted = await tx
          .delete(schedule)
          .where(
            and(
              eq(schedule.courseId, id),
              inArray(schedule.id, deletedSchedules),
            ),
          )
          .returning({ id: schedule.id });

        if (deleted.length !== deletedSchedules.length) {
          throw new NeuronError(
            "Failed to delete schedules",
            NeuronErrorCodes.INTERNAL_SERVER_ERROR,
          );
        }
      }
    });
  }

  async deleteClass(classId: string): Promise<void> {
    // Cascade will delete schedules and volunteerToSchedules
    const row = await this.db
      .delete(course)
      .where(eq(course.id, classId))
      .returning({ id: course.id });

    if (row.length !== 1) {
      throw new NeuronError(
        "Failed to delete Class",
        NeuronErrorCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async publishClass(classId: string): Promise<PublishClassResult> {
    const canViewUnpublishedTerms = hasPermission({
      user: this.currentSessionService.getUser(),
      permission: { terms: ["view-unpublished"] },
    });

    const txResult = await this.db.transaction(async (tx: Transaction) => {
      // Lock the course row so concurrent publish attempts serialize and
      // observe committed publication state before generating shifts.
      const [lockedCourse] = await tx
        .select({
          id: course.id,
          termId: course.termId,
          published: course.published,
        })
        .from(course)
        .where(eq(course.id, classId))
        .for("update");

      if (!lockedCourse) {
        throw new NeuronError(
          `Could not find Class with id ${classId}`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      const [termRow] = await tx
        .select()
        .from(term)
        .where(
          and(
            eq(term.id, lockedCourse.termId),
            canViewUnpublishedTerms ? undefined : eq(term.published, true),
          ),
        );

      if (!termRow) {
        throw new NeuronError(
          `Could not find Class with id ${classId}`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      if (lockedCourse.published) {
        return {
          status: "already_published" as const,
          createdShifts: [] as CreatedShiftOccurrence[],
        };
      }

      const termBlackouts = await tx
        .select({
          startsOn: blackout.startsOn,
          endsOn: blackout.endsOn,
        })
        .from(blackout)
        .where(eq(blackout.termId, termRow.id));

      const scheduleRows = await tx
        .select()
        .from(schedule)
        .where(eq(schedule.courseId, classId))
        .orderBy(asc(schedule.id));

      const scheduleIds = scheduleRows.map((s) => s.id);
      const scheduleBlackouts =
        scheduleIds.length > 0
          ? await tx
              .select({
                scheduleId: blackout.scheduleId,
                startsOn: blackout.startsOn,
                endsOn: blackout.endsOn,
              })
              .from(blackout)
              .where(inArray(blackout.scheduleId, scheduleIds))
          : [];

      const blackoutsByScheduleId = new Map<
        string,
        { startsOn: string; endsOn: string }[]
      >();
      for (const b of scheduleBlackouts) {
        if (!b.scheduleId) continue;
        const list = blackoutsByScheduleId.get(b.scheduleId) ?? [];
        list.push({ startsOn: b.startsOn, endsOn: b.endsOn });
        blackoutsByScheduleId.set(b.scheduleId, list);
      }

      const createdShifts: CreatedShiftOccurrence[] = [];

      for (const scheduleRow of scheduleRows) {
        const rule = this.buildScheduleRuleFromRRule(scheduleRow.rrule);
        const occurrences = expandScheduleOccurrences({
          rule,
          durationMinutes: scheduleRow.durationMinutes,
          effectiveStart: scheduleRow.effectiveStart,
          effectiveEnd: scheduleRow.effectiveEnd,
          termStartDate: termRow.startDate,
          termEndDate: termRow.endDate,
          blackouts: [
            ...termBlackouts,
            ...(blackoutsByScheduleId.get(scheduleRow.id) ?? []),
          ],
        });

        if (occurrences.length === 0) continue;

        const inserted = await this.shiftService.createShifts(
          {
            courseId: classId,
            scheduleId: scheduleRow.id,
            occurrences,
          },
          tx,
        );
        createdShifts.push(...inserted);
      }

      const updated = await tx
        .update(course)
        .set({ published: true })
        .where(eq(course.id, classId))
        .returning({ id: course.id });

      if (updated.length !== 1) {
        throw new NeuronError(
          "Failed to update Class",
          NeuronErrorCodes.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        status: "published" as const,
        createdShifts,
      };
    });

    if (txResult.createdShifts.length > 0) {
      this.shiftService.scheduleShiftNotifications(txResult.createdShifts);
    }

    return {
      classId,
      status: txResult.status,
      createdShiftCount: txResult.createdShifts.length,
    };
  }

  async publishAllClasses(): Promise<PublishAllClassesResult> {
    const courseIds = await this.db
      .select({ id: course.id })
      .from(course)
      .where(eq(course.published, false))
      .orderBy(asc(course.id));

    if (courseIds.length === 0) {
      return {
        total: 0,
        publishedCount: 0,
        alreadyPublishedCount: 0,
        failedCount: 0,
        results: [],
      };
    }

    const results: PublishClassOutcome[] = [];
    let publishedCount = 0;
    let alreadyPublishedCount = 0;
    let failedCount = 0;

    for (const { id } of courseIds) {
      try {
        const outcome = await this.publishClass(id);
        results.push(outcome);
        if (outcome.status === "published") {
          publishedCount += 1;
        } else {
          alreadyPublishedCount += 1;
        }
      } catch (error) {
        failedCount += 1;
        results.push({
          classId: id,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
          ...(error instanceof NeuronError ? { errorCode: error.code } : {}),
        });
      }
    }

    return {
      total: courseIds.length,
      publishedCount,
      alreadyPublishedCount,
      failedCount,
      results,
    };
  }

  async retrieveFullClasses({
    where,
    limit,
    offset,
  }: {
    where: SQL<unknown>;
    withTotalCount?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Class[]> {
    // Pre-filter course IDs using the standard query builder so that
    // joins (e.g. on term.published) resolve correctly. Drizzle's
    // relational findMany aliases tables, which breaks raw column refs.
    let idsQuery = this.db
      .select({ id: course.id })
      .from(course)
      .where(where)
      .$dynamic();

    if (
      !hasPermission({
        user: this.currentSessionService.getUser(),
        permission: { terms: ["view-unpublished"] },
      })
    ) {
      idsQuery = idsQuery
        .innerJoin(term, eq(course.termId, term.id))
        .where(and(where, eq(term.published, true)));
    }

    if (limit !== undefined) {
      idsQuery = idsQuery.limit(limit);
    }

    if (offset !== undefined) {
      idsQuery = idsQuery.offset(offset);
    }

    const matchedIds = await idsQuery.then((q) => q.map((r) => r.id));
    if (matchedIds.length === 0) return [];

    const courses = await this.db.query.course.findMany({
      where: inArray(course.id, matchedIds),
      orderBy: [asc(course.id)],
      with: {
        schedules: {
          with: {
            volunteers: true,
            instructors: true,
          },
        },
      },
    });

    // Get instructors and volunteers for schedules
    const instructorIds = uniqueDefined(
      courses.flatMap((course) =>
        course.schedules.flatMap((schedule) =>
          schedule.instructors.map((i) => i.instructorUserId),
        ),
      ),
    );
    const instructors = toMap(await this.userService.getUsers(instructorIds));
    const volunteerIds = uniqueDefined(
      courses.flatMap((course) =>
        course.schedules.flatMap((schedule) =>
          schedule.volunteers.map((volunteer) => volunteer.volunteerUserId),
        ),
      ),
    );
    const volunteers = toMap(
      await this.volunteerService.getVolunteers(volunteerIds),
    );

    return courses.map((course) =>
      buildClass(
        course,
        course.schedules.map((schedule) =>
          buildSchedule(
            schedule,
            this.buildScheduleRuleFromRRule(schedule.rrule),
            schedule.instructors.map(
              (ins) => instructors.get(ins.instructorUserId)!,
            ),
            schedule.volunteers.map(
              (volunteer) => volunteers.get(volunteer.volunteerUserId)!,
            ),
          ),
        ),
      ),
    );
  }

  private async updateSchedules(
    tx: Transaction,
    courseId: string,
    schedules: UpdateScheduleInput[],
    originalById: Map<string, ScheduleDB>,
  ): Promise<void> {
    // Update schedules
    for (const updateSchedule of schedules) {
      const {
        id,
        rule,
        localStartTime,
        localEndTime,
        addedVolunteerUserIds,
        removedVolunteerUserIds,
        addedInstructorUserIds,
        removedInstructorUserIds,
        effectiveStart,
        effectiveEnd,
        preferredVolunteerCount,
      } = updateSchedule;
      const originalSchedule = originalById.get(id);

      if (!originalSchedule) {
        throw new NeuronError(
          `Schedule with id ${id} does not belong to class ${courseId}.`,
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      const schedulePatch: Partial<typeof schedule.$inferInsert> = {};

      if (effectiveStart !== undefined) {
        schedulePatch.effectiveStart = effectiveStart;
      }
      if (effectiveEnd !== undefined) {
        schedulePatch.effectiveEnd = effectiveEnd;
      }
      if (preferredVolunteerCount !== undefined) {
        schedulePatch.preferredVolunteerCount = preferredVolunteerCount;
      }

      // Only parse/rebuild recurrence or duration when recurrence or timing fields are supplied.
      // Assignment-only updates leave stored rrule and durationMinutes untouched.
      if (
        rule !== undefined ||
        localStartTime !== undefined ||
        localEndTime !== undefined
      ) {
        const originalRule = this.buildScheduleRuleFromRRule(
          originalSchedule.rrule,
        );

        if (rule !== undefined || localStartTime !== undefined) {
          const nextLocalStartTime =
            localStartTime?.toString() ?? originalRule.localStartTime;
          const nextRule: ScheduleRule = rule
            ? {
                ...rule,
                localStartTime: nextLocalStartTime,
                tzid: NEURON_TIMEZONE,
              }
            : {
                ...originalRule,
                localStartTime: nextLocalStartTime,
                tzid: NEURON_TIMEZONE,
              };
          schedulePatch.rrule =
            this.buildRRuleFromScheduleRule(nextRule).toString();
        }

        if (localStartTime !== undefined || localEndTime !== undefined) {
          const originalStartTime = Temporal.PlainTime.from(
            originalRule.localStartTime,
          );
          const newStartTime = localStartTime ?? originalStartTime;
          const newEndTime =
            localEndTime ??
            originalStartTime.add(
              Temporal.Duration.from({
                minutes: originalSchedule.durationMinutes,
              }),
            );

          const durationMinutes = newStartTime
            .until(newEndTime)
            .total("minutes");
          if (durationMinutes <= 0) {
            throw new NeuronError(
              "Schedule end time must be after start time.",
              NeuronErrorCodes.BAD_REQUEST,
            );
          }
          schedulePatch.durationMinutes = durationMinutes;
        }
      }

      if (Object.keys(schedulePatch).length > 0) {
        const updated = await tx
          .update(schedule)
          .set(schedulePatch)
          .where(and(eq(schedule.id, id), eq(schedule.courseId, courseId)))
          .returning({ id: schedule.id });

        if (updated.length !== 1) {
          throw new NeuronError(
            "Failed to update schedule",
            NeuronErrorCodes.INTERNAL_SERVER_ERROR,
          );
        }
      }

      // Insert volunteers to schedule
      if (addedVolunteerUserIds.length > 0) {
        await this.ensureUsersAreRole(
          tx,
          Role.volunteer,
          addedVolunteerUserIds,
        );
        await tx
          .insert(volunteerToSchedule)
          .values(
            addedVolunteerUserIds?.map((volunteerId) => ({
              scheduleId: id,
              volunteerUserId: volunteerId,
            })),
          )
          .onConflictDoNothing({
            target: [
              volunteerToSchedule.volunteerUserId,
              volunteerToSchedule.scheduleId,
            ],
          });
      }

      // Remove volunteers from schedule
      if (removedVolunteerUserIds.length > 0) {
        await tx
          .delete(volunteerToSchedule)
          .where(
            and(
              eq(volunteerToSchedule.scheduleId, id),
              inArray(
                volunteerToSchedule.volunteerUserId,
                removedVolunteerUserIds,
              ),
            ),
          );
      }

      // Insert instructors to schedule
      if (addedInstructorUserIds.length > 0) {
        await this.ensureUsersAreRole(
          tx,
          Role.instructor,
          addedInstructorUserIds,
        );
        await tx
          .insert(instructorToSchedule)
          .values(
            addedInstructorUserIds?.map((instructorId) => ({
              scheduleId: id,
              instructorUserId: instructorId,
            })),
          )
          .onConflictDoNothing({
            target: [
              instructorToSchedule.instructorUserId,
              instructorToSchedule.scheduleId,
            ],
          });
      }

      // Remove instructors from schedule
      if (removedInstructorUserIds.length > 0) {
        await tx
          .delete(instructorToSchedule)
          .where(
            and(
              eq(instructorToSchedule.scheduleId, id),
              inArray(
                instructorToSchedule.instructorUserId,
                removedInstructorUserIds,
              ),
            ),
          );
      }
    }
  }

  private async insertSchedules(
    tx: Transaction,
    courseId: string,
    schedules: CreateScheduleInput[],
  ): Promise<void> {
    // Insert schedules
    for (const scheduleCreate of schedules) {
      const {
        volunteerUserIds,
        instructorUserIds,
        localEndTime,
        localStartTime,
        rule,
        ...scheduleData
      } = scheduleCreate;

      const rruleObject = this.buildRRuleFromScheduleRule({
        ...rule,
        localStartTime: localStartTime.toString(),
        tzid: NEURON_TIMEZONE,
      });

      const row = await tx
        .insert(schedule)
        .values({
          courseId,
          durationMinutes: localStartTime.until(localEndTime).total("minutes"),
          rrule: rruleObject.toString(),
          ...scheduleData,
        })
        .returning({ id: schedule.id })
        .then((rows) => rows[0]);

      if (!row) {
        throw new NeuronError(
          "Failed to save Class",
          NeuronErrorCodes.INTERNAL_SERVER_ERROR,
        );
      }

      // Insert volunteers to schedule
      if (volunteerUserIds.length > 0) {
        await this.ensureUsersAreRole(tx, Role.volunteer, volunteerUserIds);
        await tx.insert(volunteerToSchedule).values(
          volunteerUserIds.map((volunteerId) => ({
            scheduleId: row.id,
            volunteerUserId: volunteerId,
          })),
        );
      }

      // Insert instructors to schedule
      if (instructorUserIds.length > 0) {
        await this.ensureUsersAreRole(tx, Role.instructor, instructorUserIds);
        await tx.insert(instructorToSchedule).values(
          instructorUserIds.map((instructorId) => ({
            scheduleId: row.id,
            instructorUserId: instructorId,
          })),
        );
      }
    }
  }

  private async ensureUsersAreRole(
    tx: Transaction,
    role: Role,
    userIds: string[],
  ): Promise<void> {
    const uniqueUserIds = Array.from(new Set(userIds));
    const users = await tx
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.role, role), inArray(user.id, uniqueUserIds)));

    if (users.length !== uniqueUserIds.length) {
      throw new NeuronError(
        `All assigned ${role}s must have the ${role} role.`,
        NeuronErrorCodes.BAD_REQUEST,
      );
    }
  }

  private buildRRuleFromScheduleRule(rule: ScheduleRule): RRuleTemporal {
    return buildRRuleFromScheduleRule(rule);
  }

  private buildScheduleRuleFromRRule(rruleString: string): ScheduleRule {
    const rule = new RRuleTemporal({ rruleString });
    const options = rule.options();

    // Build base schedule rule
    const baseScheduleRule = {
      tzid: NEURON_TIMEZONE,
      localStartTime: new Temporal.PlainTime(
        options.byHour?.[0] ?? 0,
        options.byMinute?.[0] ?? 0,
        options.bySecond?.[0] ?? 0,
      ).toString(),
    };

    switch (options.freq) {
      case "WEEKLY":
        return {
          type: "weekly",
          weekday: (options.byDay?.[0] ?? "SU") as Weekday,
          interval: options.interval ?? 1,
          ...baseScheduleRule,
        };
      case "MONTHLY":
        return {
          type: "monthly",
          weekday: (options.byDay?.[0] ?? "SU") as Weekday,
          nth: options.bySetPos?.[0] ?? 1,
          ...baseScheduleRule,
        };
      case "YEARLY":
        return {
          type: "single",
          extraDates:
            options.rDate?.map((date) => date.toPlainDate().toString()) ?? [],
          ...baseScheduleRule,
        };
      default:
        throw new NeuronError(
          "Unable to build ScheduleRule from RRule",
          NeuronErrorCodes.INTERNAL_SERVER_ERROR,
        );
    }
  }
}
