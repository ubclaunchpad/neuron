import { Temporal } from "@js-temporal/polyfill";
import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import { RRuleTemporal } from "rrule-temporal";

import type { ClassRequest, CreateClassInput, UpdateClassInput } from "@/models/api/class";
import type { CreateScheduleInput, ScheduleRule, UpdateScheduleInput, Weekday } from "@/models/api/schedule";
import { buildClass, type Class, type ClassResponse } from "@/models/class";
import { ScheduleType } from "@/models/interfaces";
import type { ListResponse } from "@/models/list-response";
import { buildSchedule } from "@/models/schedule";
import type { Term } from "@/models/term";
import { type Drizzle, type Transaction } from "@/server/db";
import { course, instructorToSchedule, schedule, volunteerToSchedule } from "@/server/db/schema";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { toMap } from "@/utils/arrayUtils";
import type { InstructorService } from "./instructorService";
import type { ShiftService } from "./shiftService";
import type { TermService } from "./termService";
import type { VolunteerService } from "./volunteerService";

export class ClassService {
  private readonly db: Drizzle;
  private readonly instructorService: InstructorService;
  private readonly volunteerService: VolunteerService;
  private readonly termService: TermService;
  private readonly shiftService: ShiftService;

  constructor(
    db: Drizzle,
    instructorService: InstructorService,
    volunteerService: VolunteerService,
    termService: TermService,
    shiftService: ShiftService,
  ) {
    this.db = db;
    this.instructorService = instructorService;
    this.volunteerService = volunteerService;
    this.termService = termService;
    this.shiftService = shiftService;
  }

  async getClassesForRequest(
    listRequest: ClassRequest,
  ): Promise<ClassResponse<Class>> {
    const termId = listRequest.term;

    // If term is "current", find the current term
    let termData;
    if (termId === "current") {
      termData = await this.termService.getCurrentTerm();
      
      if (!termData) {
        throw new NeuronError("No current term found", NeuronErrorCodes.NOT_FOUND);
      }
    } else {
      termData = await this.termService.getTerm(termId);
    }

    const { data: classes } = await this.retrieveFullClasses({
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
    return await this.retrieveFullClasses({
      where: inArray(course.id, ids)
    }).then(c => c.data);
  }

  async getClass(id: string): Promise<Class> {
    return await this.retrieveFullClasses({
      where: eq(course.id, id)
    }).then(c => c.data[0]!);
  }

  async createClass(classCreate: CreateClassInput): Promise<string> {
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

  async updateClass(classUpdate: UpdateClassInput): Promise<void> {
    const {
      id,
      addedSchedules,
      updatedSchedules,
      deletedSchedules,
      ...dbClassUpdate
    } = classUpdate;

    return await this.db.transaction(async (tx: Transaction) => {
      // Update class itself
      const row = await tx.update(course).set(dbClassUpdate).where(eq(course.id, id)).returning({ id: course.id });
      if (row.length !== 1) {
        throw new NeuronError("Failed to update Class", NeuronErrorCodes.INTERNAL_SERVER_ERROR);
      }

      const courseRow = await tx.query.course.findFirst({
        where: eq(course.id, id)
      });
      
      if (courseRow?.published) {
        throw new NeuronError("Schedules can not be changed for a published class.", NeuronErrorCodes.BAD_REQUEST);
      }

      // Insert schedules
      await this.insertSchedules(tx, id, addedSchedules);

      // Update schedules
      await this.updateSchedules(tx, updatedSchedules);

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
    const row = await this.db.delete(course).where(eq(course.id, classId)).returning({ id: course.id });

    if (row.length !== 1) {
      throw new NeuronError("Failed to delete Class", NeuronErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async publishClass(classId: string): Promise<void> {
    const classToPublish = await this.getClass(classId);
    const term = await this.termService.getTerm(classToPublish.termId);

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
      })

      // create shifts for all dates in rrule
      const occurrences = finishedRule.all();
      const durationMinutes = schedule.durationMinutes;

      for (const dt of occurrences) {
        const shiftDate = dt.toPlainDate();

        const startAt = dt.toInstant().toString();
        const endAt = dt.add({ minutes: durationMinutes }).toInstant().toString();

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
        .set({
          published: true
        })
        .where(eq(course.id, classId))
        .returning({ id: course.id });
      if (row.length !== 1) {
        throw new NeuronError("Failed to update Class", NeuronErrorCodes.INTERNAL_SERVER_ERROR);
      }
    }
  }

  private getExDate(term: Term, rule: ScheduleRule, startDate: Temporal.ZonedDateTime) {
    const exDate: Temporal.ZonedDateTime[] = [];
    for (const holiday of term.holidays) {
      const start = Temporal.PlainDate.from(holiday.startsOn);
      const end = Temporal.PlainDate.from(holiday.endsOn);

      for (let d = start; Temporal.PlainDate.compare(d, end) <= 0; d = d.add({ days: 1 })) {
        exDate.push(
          d.toZonedDateTime({
            plainTime: Temporal.PlainTime.from(rule.localStartTime),
            timeZone: rule.tzid
          })
        );
      }
    }
    // prevent start dates from being included in singles
    if (rule.type == ScheduleType.single) {
      exDate.push(startDate)
    }
    return exDate;
  }

  async publishAllClasses(): Promise<void> {
    const courseIds = await this.db
      .select({ id: course.id })
      .from(course)
      .where(sql`published = false`);

    if (courseIds.length === 0) return;

    await Promise.allSettled(
      courseIds.map(({ id }) => this.publishClass(id))
    );
  }


  async retrieveFullClasses({ 
    where, 
    withTotalCount, 
    limit, 
    offset 
  }: { 
    where: SQL<unknown>, 
    withTotalCount?: boolean, 
    limit?: number, 
    offset?: number 
  }): Promise<ListResponse<Class>> {
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
      extras: {
        ...(withTotalCount ? { count: sql<number>`count(*) over()`.as('count') } : {})
      },
      limit,
      offset,
    });

    console.log(courses);

    // Get instructors and volunteers for schedules
    const instructorIds = courses.flatMap((course) =>
      course.schedules.flatMap((schedule) => schedule.instructors.map((i) => i.instructorUserId)),
    );
    const instructors = toMap(await this.instructorService.getInstructors(instructorIds));
    const volunteerIds = courses.flatMap((course) =>
      course.schedules.flatMap((schedule) =>
        schedule.volunteers.map((volunteer) => volunteer.volunteerUserId),
      ),
    );
    const volunteers = toMap(await this.volunteerService.getVolunteers(volunteerIds));

    return {
      data: courses.map((course) =>
        buildClass(
          course,
          course.schedules.map((schedule) =>
            buildSchedule(
              schedule,
              this.buildScheduleRuleFromRRule(schedule.rrule),
              schedule.instructors.map((ins) => instructors.get(ins.instructorUserId)!),
              schedule.volunteers.map((volunteer) => volunteers.get(volunteer.volunteerUserId)!),
            ),
          ),
        ),
      ),
      total: courses.length ?? 0,
    };
  }

  private async updateSchedules(
    tx: Transaction,
    schedules: UpdateScheduleInput[],
  ): Promise<void> {
    // Update schedules
    for (const updateSchedule of schedules) {
      const {
        scheduleId,
        rule,
        addedVolunteerUserIds,
        removedVolunteerUserIds,
        addedInstructorUserIds,
        removedInstructorUserIds,
        ...scheduleUpdate
      } = updateSchedule;

      await tx
        .update(schedule)
        .set({
          ...scheduleUpdate,
          rrule: rule ? this.buildRRuleFromScheduleRule(rule).toString() : undefined,
        })
        .where(eq(schedule.id, scheduleId));

      // Insert volunteers to schedule
      if (addedVolunteerUserIds) {
        await tx.insert(volunteerToSchedule).values(
          addedVolunteerUserIds?.map((volunteerId) => ({
            scheduleId,
            volunteerUserId: volunteerId,
          })),
        );
      }

      // Remove volunteers from schedule
      if (removedVolunteerUserIds) {
        await tx
          .delete(volunteerToSchedule)
          .where(
            and(
              eq(volunteerToSchedule.scheduleId, scheduleId),
              inArray(
                volunteerToSchedule.volunteerUserId,
                removedVolunteerUserIds,
              ),
            ),
          );
      }

      // Insert instructors to schedule
      if (addedInstructorUserIds) {
        await tx.insert(instructorToSchedule).values(
          addedInstructorUserIds?.map((instructorId) => ({
            scheduleId,
            instructorUserId: instructorId,
          })),
        );
      }

      // Remove instructors from schedule
      if (removedInstructorUserIds) {
        await tx
          .delete(instructorToSchedule)
          .where(
            and(
              eq(instructorToSchedule.scheduleId, scheduleId),
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
    for (const createSchedule of schedules) {
      const { volunteerUserIds, instructorUserIds, rule, ...scheduleCreate } = createSchedule;
      const rruleObject = this.buildRRuleFromScheduleRule(rule);

      const row = await tx
        .insert(schedule)
        .values({ ...scheduleCreate, courseId, rrule: rruleObject.toString() })
        .returning({ id: schedule.id })
        .then((rows) => rows[0]);

      if (!row) {
        throw new NeuronError("Failed to save Class", NeuronErrorCodes.INTERNAL_SERVER_ERROR);
      }

      // Insert volunteers to schedule
      if (volunteerUserIds.length > 0) {
        await tx.insert(volunteerToSchedule).values(
          volunteerUserIds.map((volunteerId) => ({
            scheduleId: row.id,
            volunteerUserId: volunteerId,
          })),
        );
      }

      // Insert instructors to schedule
      if (instructorUserIds.length > 0) {
        await tx.insert(instructorToSchedule).values(
          instructorUserIds.map((instructorId) => ({
            scheduleId: row.id,
            instructorUserId: instructorId,
          })),
        );
      }
    }
  }

  private readonly PlaceholderDate = Temporal.Instant.fromEpochMilliseconds(0).toZonedDateTimeISO("UTC");
  private buildRRuleFromScheduleRule(rule: ScheduleRule): RRuleTemporal {
    // Build base RRule parameters
    const { hour, minute, second } = Temporal.PlainTime.from(rule.localStartTime);
    const baseRRuleParams = {
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
          rDate: rule.extraDates.map(
            (date) => this.toTemporalZonedDateTime(date, rule)
          ),
        });
    }
  }

  private toTemporalZonedDateTime(date: string, rule: ScheduleRule): Temporal.ZonedDateTime {
    return Temporal.PlainDate.from(date).toZonedDateTime({
      timeZone: rule.tzid,
      plainTime: Temporal.PlainTime.from(rule.localStartTime)
    });
  }

  private buildScheduleRuleFromRRule(rruleString: string): ScheduleRule {
    const rule = new RRuleTemporal({ rruleString });
    const options = rule.options();

    // Build base schedule rule
    const baseScheduleRule = {
      tzid: options.tzid ?? "America/Vancouver",
      localStartTime: new Temporal.PlainTime(options.byHour?.[0] ?? 0, options.byMinute?.[0] ?? 0, options.bySecond?.[0] ?? 0).toString(),
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
          extraDates: options.rDate?.map((date) => date.toPlainDate().toString()) ?? [],
          ...baseScheduleRule,
        };
      default:
        throw new NeuronError("Unable to build ScheduleRule from RRule", NeuronErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
