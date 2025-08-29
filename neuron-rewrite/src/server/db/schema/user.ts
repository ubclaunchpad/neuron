import { AVAILABILITY_SLOTS } from "@/constants";
import { Role, Status } from "@/models/interfaces";
import { image } from "@/server/db/schema/image";
import { schedule } from "@/server/db/schema/schedule";
import { sql } from "drizzle-orm";
import { bit, boolean, check, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const role = pgEnum("role", Role.values);
export const status = pgEnum("status", Status.values);

export const user = pgTable("user", {
    // Required Better-Auth fields
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

    // Required by admin plugin
    role: role('role').notNull(),
    banned: boolean('banned'),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires'),

    // Additional fields
    status: status('status').notNull().default(Status.pending),
    lastName: text('last_name').notNull(),
    imageId: uuid('image_id').references(() => image.imageId, { onDelete: "set null" }),
});

export const volunteer = pgTable("volunteer", {
    userId: uuid("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
    preferredName: text("preferred_name"),
    bio: text("bio"),
    pronouns: text("pronouns"),
    phoneNumber: text("phone_number"),
    city: text("city"),
    province: text("province"),
    availability: bit("availability", { dimensions: AVAILABILITY_SLOTS }),
    preferredTimeCommitmentHours: integer("preferred_time_commitment_hours").notNull().default(0),
});

export const coursePreference = pgTable("course_preference", {
    volunteerUserId: uuid("volunteer_user_id").notNull().references(() => volunteer.userId, { onDelete: "cascade" }),
    scheduleId: uuid("schedule_id").notNull().references(() => schedule.scheduleId, { onDelete: "cascade" }),
    courseRank: integer("course_rank").notNull(),
}, (table) => [
    primaryKey({ name: "pk_course_preferences", columns: [table.volunteerUserId, table.scheduleId] }),
    uniqueIndex().on(table.volunteerUserId, table.courseRank),
    check("chk_course_rank_positive", sql`${table.courseRank} > 0`),
]);

export const instructor = pgTable("instructor", {
    userId: uuid("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
});

export const admin = pgTable("admin", {
    userId: uuid("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
});