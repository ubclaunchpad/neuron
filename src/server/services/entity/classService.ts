import { Temporal } from "@js-temporal/polyfill";
import { and, eq, inArray, sql, SQL } from "drizzle-orm";
import { RRuleTemporal } from "rrule-temporal";

import { NEURON_TIMEZONE } from "@/lib/constants";
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
import type { Term } from "@/models/term";
import { type Drizzle, type Transaction } from "@/server/db";
import {
  course,
  instructorToSchedule,
  schedule,
  user,
  volunteerToSchedule,
} from "@/server/db/schema";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { toMap, uniqueDefined } from "@/utils/arrayUtils";
import type { ImageService } from "../imageService";
import { ShiftService } from "./shiftService";
import type { TermService } from "./termService";
import { UserService } from "./userService";
import { VolunteerService } from "./volunteerService";

export class ClassService {
  private readonly db: Drizzle;
  private readonly userService: UserService;
  private readonly volunteerService: VolunteerService;
  private readonly termService: TermService;
  private readonly shiftService: ShiftService;
  private readonly imageService: ImageService;

  constructor(
    db: Drizzle,
    userService: UserService,
    volunteerService: VolunteerService,
    termService: TermService,
    shiftService: ShiftService,
    imageService: ImageService,
  ) {
    this.db = db;
    this.userService = userService;
    this.volunteerService = volunteerService;
    this.termService = termService;
    this.shiftService = shiftService;
    this.imageService = imageService;
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

  async updateClass(classUpdate: UpdateClassOutput): Promise<void> {
    const {
      id,
      addedSchedules,
      updatedSchedules,
      deletedSchedules,
      ...dbClassUpdate
    } = classUpdate;

    return await this.db.transaction(async (tx: Transaction) => {
      const originalClass = (
        await tx.select().from(course).where(eq(course.id, id))
      )[0];

      if (!originalClass) {
        throw new NeuronError(
          "Class does not exist",
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

      // Clean up image if we deleted it
      const oldImageKey = originalClass.image;
      if (!!oldImageKey && !!dbClassUpdate.image) {
        await this.imageService.deleteImage(oldImageKey);
      }

      // Cannot add, delete, or update recurrances
      if (
        originalClass.published &&
        (addedSchedules.length > 0 ||
          deletedSchedules.length > 0 ||
          updatedSchedules.some(
            (s) =>
              s.effectiveEnd !== undefined ||
              s.effectiveStart !== undefined ||
              s.rule !== undefined ||
              s.localEndTime !== undefined ||
              s.localEndTime !== undefined,
          ))
      ) {
        throw new NeuronError(
          "Schedules recurrances can not be changed for a published class.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      console.log(updatedSchedules);

      // Update schedules
      await this.updateSchedules(tx, updatedSchedules);

      // Insert schedules
      await this.insertSchedules(tx, id, addedSchedules);

      // Delete schedules
      if (deletedSchedules) {
        await tx
          .delete(schedule)
          .where(
            and(
              eq(schedule.courseId, id),
              inArray(schedule.id, deletedSchedules),
            ),
          );
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

  async publishClass(classId: string): Promise<void> {
    const classToPublish = await this.getClass(classId);
    const term = await this.termService.getTerm(classToPublish.termId);

    return await this.db.transaction(async (tx: Transaction) => {
      const schedulesToPublish = classToPublish.schedules;
      for (const schedule of schedulesToPublish) {
        // schedule start/end dates override term start/end dates
        const startDate = schedule.effectiveStart ?? term.startDate;
        const endDate = schedule.effectiveEnd ?? term.endDate;

        const rule = schedule.rule;
        const dtstart = this.toTemporalZonedDateTime(startDate, rule);
        const until = this.toTemporalZonedDateTime(endDate, rule);

        const rrule = this.buildRRuleFromScheduleRule(rule);
        const exDate = this.getExDate(term, rule, dtstart);

        const finishedRule = new RRuleTemporal({
          ...rrule.options(),
          dtstart,
          until,
          exDate,
        });

        // create shifts for all dates in rrule
        const occurrences = finishedRule.all();
        const durationMinutes = schedule.durationMinutes;

        for (const dt of occurrences) {
          const shiftDate = dt.toPlainDate();

          const startAt = dt.toInstant().toString();
          const endAt = dt
            .add({ minutes: durationMinutes })
            .toInstant()
            .toString();

          // store start/end times in UTC
          await this.shiftService.createShift({
            scheduleId: schedule.id,
            date: shiftDate.toString(),
            startAt,
            endAt,
          });
        }

        // update class to published
        const row = await this.db
          .update(course)
          .set({ published: true })
          .where(eq(course.id, classId))
          .returning({ id: course.id });

        if (row.length !== 1) {
          throw new NeuronError(
            "Failed to update Class",
            NeuronErrorCodes.INTERNAL_SERVER_ERROR,
          );
        }
      }
    });
  }

  private getExDate(
    term: Term,
    rule: ScheduleRule,
    startDate: Temporal.ZonedDateTime,
  ) {
    const exDate: Temporal.ZonedDateTime[] = [];
    for (const holiday of term.holidays) {
      const start = Temporal.PlainDate.from(holiday.startsOn);
      const end = Temporal.PlainDate.from(holiday.endsOn);

      for (
        let d = start;
        Temporal.PlainDate.compare(d, end) <= 0;
        d = d.add({ days: 1 })
      ) {
        exDate.push(
          d.toZonedDateTime({
            plainTime: Temporal.PlainTime.from(rule.localStartTime),
            timeZone: rule.tzid,
          }),
        );
      }
    }
    // prevent start dates from being included in singles
    if (rule.type == ScheduleType.single) {
      exDate.push(startDate);
    }
    return exDate;
  }

  async publishAllClasses(): Promise<void> {
    const courseIds = await this.db
      .select({ id: course.id })
      .from(course)
      .where(sql`published = false`);

    if (courseIds.length === 0) return;

    await Promise.allSettled(courseIds.map(({ id }) => this.publishClass(id)));
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
    const courses = await this.db.query.course.findMany({
      where,
      with: {
        schedules: {
          with: {
            volunteers: true,
            instructors: true,
          },
        },
      },
      limit,
      offset,
    });

    // Get instructors and volunteers for schedules
    const instructorIds = courses.flatMap((course) =>
      course.schedules.flatMap((schedule) =>
        schedule.instructors.map((i) => i.instructorUserId),
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
    schedules: UpdateScheduleInput[],
  ): Promise<void> {
    const originalSchedules = await tx
      .select()
      .from(schedule)
      .where(
        inArray(
          schedule.id,
          schedules.map((s) => s.id),
        ),
      );

    if (originalSchedules.length != schedules.length) {
      throw new NeuronError(
        "Failed to update schedule",
        "INTERNAL_SERVER_ERROR",
      );
    }

    // Update schedules
    for (const [idx, updateSchedule] of schedules.entries()) {
      const {
        id,
        rule,
        localStartTime,
        localEndTime,
        addedVolunteerUserIds,
        removedVolunteerUserIds,
        addedInstructorUserIds,
        removedInstructorUserIds,
        ...scheduleUpdate
      } = updateSchedule;
      const originalSchedule = originalSchedules[idx]!;

      const originalRRruleObject = this.buildScheduleRuleFromRRule(
        originalSchedule.rrule,
      );
      const rruleObject = this.buildRRuleFromScheduleRule({
        ...originalRRruleObject,
        ...rule,
        localStartTime:
          localStartTime?.toString() ?? originalRRruleObject.localStartTime,
        tzid: NEURON_TIMEZONE,
      });

      let durationMinutes = undefined;
      if (localStartTime || localEndTime) {
        // This is what we have to use in case they only updated
        const newStartTime =
          localStartTime ??
          Temporal.PlainTime.from(originalRRruleObject.localStartTime);
        const newEndTime =
          localEndTime ??
          Temporal.PlainTime.from(originalRRruleObject.localStartTime).add(
            Temporal.Duration.from({
              minutes: originalSchedule.durationMinutes,
            }),
          );

        durationMinutes = newStartTime.until(newEndTime).total("minutes");
      }

      console.log(scheduleUpdate);
      const updated = await tx
        .update(schedule)
        .set({
          durationMinutes,
          rrule: rruleObject.toString(),
          ...scheduleUpdate,
        })
        .where(eq(schedule.id, id))
        .returning({ id: schedule.id });

      if (updated.length != 1) {
        throw new NeuronError(
          "Failed to update schedule",
          "INTERNAL_SERVER_ERROR",
        );
      }

      // Insert volunteers to schedule
      if (addedVolunteerUserIds.length > 0) {
        await this.ensureUsersAreRole(
          tx,
          Role.volunteer,
          addedVolunteerUserIds,
        );
        await tx.insert(volunteerToSchedule).values(
          addedVolunteerUserIds?.map((volunteerId) => ({
            scheduleId: id,
            volunteerUserId: volunteerId,
          })),
        );
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
        await tx.insert(instructorToSchedule).values(
          addedInstructorUserIds?.map((instructorId) => ({
            scheduleId: id,
            instructorUserId: instructorId,
          })),
        );
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
    const users = await tx
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.role, role), inArray(user.id, userIds)));

    if (users.length !== userIds.length) {
      throw new NeuronError(
        `All assigned ${role}s must have the ${role} role.`,
        NeuronErrorCodes.BAD_REQUEST,
      );
    }
  }

  private readonly PlaceholderDate =
    Temporal.Instant.fromEpochMilliseconds(0).toZonedDateTimeISO("UTC");
  private buildRRuleFromScheduleRule(rule: ScheduleRule): RRuleTemporal {
    // Build base RRule parameters
    const { hour, minute, second } = Temporal.PlainTime.from(
      rule.localStartTime,
    );
    let baseRRuleParams = {
      dtstart: this.PlaceholderDate,
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
            this.toTemporalZonedDateTime(date, rule),
          ),
        });
    }
  }

  private toTemporalZonedDateTime(
    date: string,
    rule: ScheduleRule,
  ): Temporal.ZonedDateTime {
    return Temporal.PlainDate.from(date).toZonedDateTime({
      timeZone: rule.tzid,
      plainTime: Temporal.PlainTime.from(rule.localStartTime),
    });
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
