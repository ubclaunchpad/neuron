import { AVAILABILITY_SLOTS } from "@/constants";
import { Role, UserStatus } from "@/models/interfaces";
import { eq, relations } from "drizzle-orm";
import {
  bit,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { course } from "./course";

export const role = pgEnum("role", Role.values);
export const status = pgEnum("status", UserStatus.values);

export const user = pgTable(
  "user",
  {
    // Required Better-Auth fields
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    // Additional fields
    role: role("role").notNull(),
    status: status("status").notNull().default(UserStatus.unverified),
    lastName: text("last_name").notNull(),
  },
  (table) => [
    index("idx_user_email").on(table.email),
    index("idx_user_role").on(table.role),
    index("idx_user_status").on(table.status),
    index("idx_user_created_at").on(table.createdAt),
  ],
);
export type UserDB = typeof user.$inferSelect;

export const userRelations = relations(user, ({ one }) => ({
  volunteerProfile: one(volunteer, {
    fields: [user.id],
    references: [volunteer.userId],
  }),
}));

export const volunteer = pgTable(
  "volunteer",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    preferredName: text("preferred_name"),
    bio: text("bio"),
    pronouns: text("pronouns"),
    phoneNumber: text("phone_number"),
    city: text("city"),
    province: text("province"),
    availability: bit("availability", { dimensions: AVAILABILITY_SLOTS })
      .default("0".repeat(AVAILABILITY_SLOTS))
      .notNull(),
    preferredTimeCommitmentHours: integer("preferred_time_commitment_hours"),
  },
  (table) => [
    index("idx_volunteer_city").on(table.city),
    index("idx_volunteer_province").on(table.province),
  ],
);
export type VolunteerProfileDB = typeof volunteer.$inferSelect;

export const volunteerRelations = relations(volunteer, ({ one, many }) => ({
  user: one(user, {
    fields: [volunteer.userId],
    references: [user.id],
  }),
  coursePreferences: many(coursePreference),
}));

export const coursePreference = pgTable(
  "course_preference",
  {
    volunteerUserId: uuid("volunteer_user_id")
      .notNull()
      .references(() => volunteer.userId, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: "pk_course_preferences",
      columns: [table.volunteerUserId, table.courseId],
    }),
  ],
);
export type CoursePreferenceDB = typeof coursePreference.$inferSelect;

export const coursePreferenceRelations = relations(
  coursePreference,
  ({ one }) => ({
    volunteer: one(volunteer, {
      fields: [coursePreference.volunteerUserId],
      references: [volunteer.userId],
    }),
    course: one(course, {
      fields: [coursePreference.courseId],
      references: [course.id],
    }),
  }),
);

export const volunteerUserView = pgView("vw_volunteer_user").as((qb) =>
  qb
    .select({
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
      preferredName: volunteer.preferredName,
      bio: volunteer.bio,
      pronouns: volunteer.pronouns,
      phoneNumber: volunteer.phoneNumber,
      city: volunteer.city,
      province: volunteer.province,
      availability: volunteer.availability,
      preferredTimeCommitmentHours: volunteer.preferredTimeCommitmentHours,
    })
    .from(user)
    .innerJoin(volunteer, eq(volunteer.userId, user.id))
    .where(eq(user.role, "volunteer")),
);
export type VolunteerUserViewDB = typeof volunteerUserView.$inferSelect;

export const instructorUserView = pgView("vw_instructor_user").as((qb) =>
  qb.select().from(user).where(eq(user.role, "instructor")),
);
export type InstructorUserViewDB = typeof instructorUserView.$inferSelect;
