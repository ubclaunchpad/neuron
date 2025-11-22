import { course } from "@/server/db/schema/course";
import { volunteer } from "@/server/db/schema/user";
import { relations } from "drizzle-orm";
import {
    bigserial, index, pgTable,
    text,
    timestamp,
    uuid
} from "drizzle-orm/pg-core";

export const log = pgTable("log", {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    page: text("page").notNull(),
    page2: text("page2").notNull(),
    signoff: text("signoff").notNull(),
    description: text("description").notNull(),
    volunteerUserId: uuid("volunteer_user_id").references(() => volunteer.userId, { onDelete: "set null" }),
    courseId: uuid("course_id").references(() => course.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index("idx_logs_volunteer").on(table.volunteerUserId),
    index("idx_logs_course").on(table.courseId),
    index("idx_logs_created_at").on(table.createdAt),
    index("idx_logs_page").on(table.page),
]);
export type LogDB = typeof log.$inferSelect;

export const logRelations = relations(log, ({ one }) => ({
    volunteer: one(volunteer, {
        fields: [log.volunteerUserId],
        references: [volunteer.userId],
    }),
    course: one(course, {
        fields: [log.courseId],
        references: [course.id],
    }),
}));
