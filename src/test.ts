import "dotenv/config";
import { exit } from "process";
import { eq } from "drizzle-orm";
import { createRequestScope } from "./server/api/di-container";
import { course, schedule } from "./server/db/schema";

const ctx = createRequestScope();
const { termService, shiftService, db } = ctx.cradle;

async function main(): Promise<number> {
  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const isoTime = (time: string) => new Date(`${date}T${time}Z`).toISOString();

  let termId: string | undefined;
  let courseId: string | undefined;
  let scheduleId: string | undefined;
  let shiftId: string | undefined;

  try {
    termId = await termService.createTerm({
      name: `Test Term ${today.getFullYear()}`,
      startDate: date,
      endDate,
    });

    courseId = await db
      .insert(course)
      .values({ termId, name: `Test Class ${today.getTime()}` })
      .returning({ id: course.id })
      .then(([row]) => row?.id);
    if (!courseId) throw new Error("Failed to create course");

    const rrule = "RRULE:FREQ=YEARLY;COUNT=1";

    scheduleId = await db
      .insert(schedule)
      .values({
        courseId,
        durationMinutes: 60,
        rrule,
        effectiveStart: date,
        effectiveEnd: date,
      })
      .returning({ id: schedule.id })
      .then(([row]) => row?.id);
    if (!scheduleId) throw new Error("Failed to create schedule");

    shiftId = await shiftService.createShift({
      courseId,
      scheduleId,
      date,
      startAt: isoTime("09:00:00"),
      endAt: isoTime("10:00:00"),
    });
    console.log("shift created:", shiftId);

    await shiftService.deleteShift({ shiftId });
    console.log("shift removed");
    shiftId = undefined;
    return 0;
  } catch (err) {
    console.error("error:", err);
    return 1;
  } finally {
    if (shiftId) {
      await shiftService.deleteShift({ shiftId }).catch((error) =>
        console.error("cleanup shift failed", error),
      );
    }
    if (scheduleId) {
      await db.delete(schedule).where(eq(schedule.id, scheduleId)).catch((error) =>
        console.error("cleanup schedule failed", error),
      );
    }
    if (courseId) {
      await db.delete(course).where(eq(course.id, courseId)).catch((error) =>
        console.error("cleanup course failed", error),
      );
    }
    if (termId) {
      await termService.deleteTerm(termId).catch((error) =>
        console.error("cleanup term failed", error),
      );
    }
  }
}

void main().then((code) => exit(code));
