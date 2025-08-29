import { course } from "@/server/db/schema/course";
import { volunteer } from "@/server/db/schema/user";
import {
    bigserial, index, pgTable,
    text,
    timestamp,
    uuid
} from "drizzle-orm/pg-core";

export const log = pgTable("log", {
    logId: bigserial("log_id", { mode: "bigint" }).primaryKey(),
    page: text("page").notNull(),
    signoff: text("signoff").notNull(),
    description: text("description").notNull(),
    volunteerUserId: uuid("volunteer_user_id").references(() => volunteer.userId, { onDelete: "set null" }),
    courseId: uuid("course_id").references(() => course.courseId, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index("idx_logs_volunteer").on(table.volunteerUserId),
    index("idx_logs_course").on(table.courseId),
    index("idx_logs_created_at").on(table.createdAt),
]);
