import { Temporal } from "@js-temporal/polyfill";
import { and, eq, sql } from "drizzle-orm";
import { RRuleTemporal } from "rrule-temporal";
import { z } from "zod";
import { formatScheduleRecurrence, formatTimeRange } from "@/lib/schedule-fmt";
import type { Weekday } from "@/models/api/schedule";
import { UserStatus } from "@/models/interfaces";
import {
  course,
  term,
  schedule,
  user,
  volunteerToSchedule,
} from "@/server/db/schema";
import { renderScheduleAssignment } from "@/server/emails/templates/schedule-assignment";
import type { RegisteredJob } from "../types";

const assignmentChange = z.object({
  scheduleId: z.uuid(),
  volunteerUserId: z.uuid(),
  change: z.enum(["added", "removed"]),
});
export type ScheduleAssignmentChange = z.infer<typeof assignmentChange>;

export const notifyScheduleAssignmentJob = {
  name: "jobs.notify-schedule-assignment",
  retryOpts: { retryLimit: 3, retryDelay: 30, retryBackoff: true },
  async handler(payload, { cradle, isCancelled }) {
    payload = assignmentChange.parse(payload);
    const email = await cradle.db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
      // Lock term -> course -> schedule -> user, matching class saves and
      // cascading term deletion. Release these locks before contacting SMTP.
      const [details] = await tx
        .select({
          className: course.name,
          classPublished: course.published,
          termPublished: term.published,
          rrule: schedule.rrule,
          durationMinutes: schedule.durationMinutes,
        })
        .from(term)
        .innerJoin(course, eq(course.termId, term.id))
        .innerJoin(schedule, eq(schedule.courseId, course.id))
        .where(eq(schedule.id, payload.scheduleId))
        .for("share");
      const [volunteer] = await tx
        .select({ name: user.name, email: user.email, status: user.status })
        .from(user)
        .where(eq(user.id, payload.volunteerUserId))
        .for("share");
      const [assignment] = await tx
        .select()
        .from(volunteerToSchedule)
        .where(
          and(
            eq(volunteerToSchedule.scheduleId, payload.scheduleId),
            eq(volunteerToSchedule.volunteerUserId, payload.volunteerUserId),
          ),
        );
      if (
        !details?.classPublished ||
        !details.termPublished ||
        volunteer?.status !== UserStatus.active
      )
        return;
      if ((payload.change === "added") !== !!assignment) return;
      const { html, text } = await renderScheduleAssignment({
        volunteerName: volunteer.name,
        className: details.className,
        scheduleDescription: describeSchedule(
          details.rrule,
          details.durationMinutes,
        ),
        scheduleUrl: new URL(
          "/schedule",
          cradle.env.NEURON_BASE_URL,
        ).toString(),
        change: payload.change,
      });
      return {
        to: volunteer.email,
        subject:
          payload.change === "added"
            ? `New schedule assignment: ${details.className}`
            : `Schedule assignment removed: ${details.className}`,
        text,
        html,
      };
    });
    // Recheck native cancellation after releasing the database transaction.
    // Once SMTP starts, later edits cannot retract an in-flight message.
    if (!email || (await isCancelled?.())) return;
    await cradle.emailService.send(
      email.to,
      email.subject,
      email.text,
      email.html,
    );
  },
} as const satisfies RegisteredJob<ScheduleAssignmentChange>;

function describeSchedule(rruleString: string, durationMinutes: number) {
  const options = new RRuleTemporal({ rruleString }).options();
  const startTime = new Temporal.PlainTime(
    options.byHour?.[0] ?? 0,
    options.byMinute?.[0] ?? 0,
    options.bySecond?.[0] ?? 0,
  );
  const endTime = startTime.add({ minutes: durationMinutes });

  const recurrence = (() => {
    switch (options.freq) {
      case "WEEKLY":
        return formatScheduleRecurrence({
          type: "weekly",
          weekday: (options.byDay?.[0] ?? "SU") as Weekday,
          interval: options.interval ?? 1,
        });
      case "MONTHLY":
        return formatScheduleRecurrence({
          type: "monthly",
          weekday: (options.byDay?.[0] ?? "SU") as Weekday,
          nth: options.bySetPos?.[0] ?? 1,
        });
      case "YEARLY":
        return formatScheduleRecurrence({
          type: "single",
          extraDates:
            options.rDate?.map((date) => date.toPlainDate().toString()) ?? [],
        });
      default:
        return "Scheduled class";
    }
  })();

  return `${recurrence}, ${formatTimeRange(startTime.toString(), endTime.toString())}`;
}
