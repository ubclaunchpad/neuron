import type {
  ClassRequest,
  CreateClassInput,
  CreateScheduleInput,
  UpdateClassInput,
  UpdateScheduleInput
} from "@/models/api/class";
import { buildClass, buildSchedule, type Class, type ClassResponse } from "@/models/class";
import type { ListResponse } from "@/models/list-response";
import { type Drizzle, type Transaction } from "@/server/db";
import {
  course,
  schedule,
  volunteerToSchedule
} from "@/server/db/schema/course";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { toMap } from "@/utils/arrayUtils";
import { and, eq, inArray, sql, SQL } from "drizzle-orm";
import { InstructorService } from "./instructorService";
import type { TermService } from "./termService";
import { VolunteerService } from "./volunteerService";

export class ClassService {
  private readonly db: Drizzle;
  private readonly instructorService: InstructorService;
  private readonly volunteerService: VolunteerService;
  private readonly termService: TermService;

  constructor(db: Drizzle, instructorService: InstructorService, volunteerService: VolunteerService, termService: TermService) {
    this.db = db;
    this.instructorService = instructorService;
    this.volunteerService = volunteerService;
    this.termService = termService;
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
        throw new NeuronError("No current term found", NeuronErrorCodes.NOT_FOUND);
      }
    } else {
      termData = await this.termService.getTerm(termId);
    }

    const { data: classes, total } = await this.retrieveFullClasses({
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
    throw new Error("Not implemented");
  }

  async publishAllClasses(): Promise<void> {
    throw new Error("Not implemented");
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
      course.schedules.flatMap((schedule) => schedule.instructorUserId ?? []),
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
              schedule.instructorUserId
                ? instructors.get(schedule.instructorUserId)!
                : undefined,
              schedule.volunteers.map(
                (volunteer) => volunteers.get(volunteer.volunteerUserId)!,
              ),
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
        addedVolunteerUserIds,
        removedVolunteerUserIds,
        ...scheduleUpdate
      } = updateSchedule;
      await tx
        .update(schedule)
        .set(scheduleUpdate)
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
    }
  }

  private async insertSchedules(
    tx: Transaction,
    courseId: string,
    schedules: CreateScheduleInput[],
  ): Promise<void> {
    // Insert schedules
    for (const createSchedule of schedules) {
      const { volunteerUserIds, ...scheduleCreate } = createSchedule;
      const row = await tx
        .insert(schedule)
        .values({ ...scheduleCreate, courseId })
        .returning({ id: schedule.id })
        .then((rows) => rows[0]);

      if (!row) {
        throw new NeuronError("Failed to save Class", NeuronErrorCodes.INTERNAL_SERVER_ERROR);
      }

      // Insert volunteers to schedule
      await tx.insert(volunteerToSchedule).values(
        volunteerUserIds.map((volunteerId) => ({
          scheduleId: row.id,
          volunteerUserId: volunteerId,
        })),
      );
    }
  }
}
