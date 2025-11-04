CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'excused', 'late');--> statement-breakpoint
CREATE TYPE "public"."coverage_category" AS ENUM('emergency', 'health', 'conflict', 'transportation', 'other');--> statement-breakpoint
CREATE TYPE "public"."coverage_status" AS ENUM('open', 'withdrawn', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'instructor', 'volunteer');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('unverified', 'rejected', 'active', 'inactive');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blackout" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid,
	"schedule_id" uuid,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	CONSTRAINT "chk_blackout_owner_xor" CHECK (( "blackout"."term_id" IS NOT NULL ) <> ( "blackout"."schedule_id" IS NOT NULL )),
	CONSTRAINT "chk_blackout_range_valid" CHECK ("blackout"."ends_on" >= "blackout"."starts_on")
);
--> statement-breakpoint
CREATE TABLE "course" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"image" text,
	"name" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"description" text,
	"meeting_url" text,
	"category" text NOT NULL,
	"subcategory" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "term" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	CONSTRAINT "chk_term_date_ok" CHECK ("term"."end_date" >= "term"."start_date")
);
--> statement-breakpoint
CREATE TABLE "log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"page" text NOT NULL,
	"signoff" text NOT NULL,
	"description" text NOT NULL,
	"volunteer_user_id" uuid,
	"course_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor_to_schedule" (
	"instructor_user_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	CONSTRAINT "pk_instructor_schedule" PRIMARY KEY("instructor_user_id","schedule_id")
);
--> statement-breakpoint
CREATE TABLE "schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"duration_minutes" smallint NOT NULL,
	"effective_start" date,
	"effective_end" date,
	"rrule" text NOT NULL,
	CONSTRAINT "chk_schedule_duration_positive" CHECK ("schedule"."duration_minutes" > 0),
	CONSTRAINT "chk_schedule_effective_range_valid" CHECK ("schedule"."effective_end" IS NULL
             OR "schedule"."effective_start" IS NULL
             OR "schedule"."effective_end" >= "schedule"."effective_start")
);
--> statement-breakpoint
CREATE TABLE "volunteer_to_schedule" (
	"volunteer_user_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	CONSTRAINT "pk_volunteer_schedule" PRIMARY KEY("volunteer_user_id","schedule_id")
);
--> statement-breakpoint
CREATE TABLE "coverage_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"category" "coverage_category" NOT NULL,
	"details" text NOT NULL,
	"comments" text,
	"status" "coverage_status" DEFAULT 'open' NOT NULL,
	"requesting_volunteer_user_id" uuid,
	"covered_by_volunteer_user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "shift" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"date" date NOT NULL,
	"canceled" boolean DEFAULT false NOT NULL,
	"cancel_reason" text,
	"canceled_at" timestamp with time zone,
	CONSTRAINT "chk_shift_time" CHECK ("shift"."end_at" > "shift"."start_at")
);
--> statement-breakpoint
CREATE TABLE "shift_attendance" (
	"shift_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "attendance_status" NOT NULL,
	"checked_in_at" timestamp with time zone,
	"minutes_worked" smallint,
	CONSTRAINT "pk_shift_attendance" PRIMARY KEY("shift_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "course_preference" (
	"volunteer_user_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"course_rank" integer NOT NULL,
	CONSTRAINT "pk_course_preferences" PRIMARY KEY("volunteer_user_id","schedule_id"),
	CONSTRAINT "chk_course_rank_positive" CHECK ("course_preference"."course_rank" > 0)
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" "role" NOT NULL,
	"status" "status" DEFAULT 'unverified' NOT NULL,
	"last_name" text NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "volunteer" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"preferred_name" text,
	"bio" text,
	"pronouns" text,
	"phone_number" text,
	"city" text,
	"province" text,
	"availability" bit(140) DEFAULT '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' NOT NULL,
	"preferred_time_commitment_hours" integer
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blackout" ADD CONSTRAINT "blackout_term_id_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."term"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blackout" ADD CONSTRAINT "blackout_schedule_id_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_term_id_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."term"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log" ADD CONSTRAINT "log_volunteer_user_id_volunteer_user_id_fk" FOREIGN KEY ("volunteer_user_id") REFERENCES "public"."volunteer"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log" ADD CONSTRAINT "log_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_to_schedule" ADD CONSTRAINT "instructor_to_schedule_instructor_user_id_user_id_fk" FOREIGN KEY ("instructor_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_to_schedule" ADD CONSTRAINT "instructor_to_schedule_schedule_id_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_to_schedule" ADD CONSTRAINT "volunteer_to_schedule_volunteer_user_id_volunteer_user_id_fk" FOREIGN KEY ("volunteer_user_id") REFERENCES "public"."volunteer"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_to_schedule" ADD CONSTRAINT "volunteer_to_schedule_schedule_id_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_request" ADD CONSTRAINT "coverage_request_shift_id_shift_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shift"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_request" ADD CONSTRAINT "coverage_request_requesting_volunteer_user_id_volunteer_user_id_fk" FOREIGN KEY ("requesting_volunteer_user_id") REFERENCES "public"."volunteer"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_request" ADD CONSTRAINT "coverage_request_covered_by_volunteer_user_id_volunteer_user_id_fk" FOREIGN KEY ("covered_by_volunteer_user_id") REFERENCES "public"."volunteer"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift" ADD CONSTRAINT "shift_class_id_course_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift" ADD CONSTRAINT "shift_schedule_id_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_attendance" ADD CONSTRAINT "shift_attendance_shift_id_shift_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shift"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_attendance" ADD CONSTRAINT "shift_attendance_user_id_volunteer_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."volunteer"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_preference" ADD CONSTRAINT "course_preference_volunteer_user_id_volunteer_user_id_fk" FOREIGN KEY ("volunteer_user_id") REFERENCES "public"."volunteer"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_preference" ADD CONSTRAINT "course_preference_schedule_id_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer" ADD CONSTRAINT "volunteer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_index" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_id_account_id_index" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "session_user_id_index" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_index" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "verification_identifier_index" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_identifier_value_index" ON "verification" USING btree ("identifier","value");--> statement-breakpoint
CREATE INDEX "blackout_term_id_starts_on_ends_on_index" ON "blackout" USING btree ("term_id","starts_on","ends_on");--> statement-breakpoint
CREATE INDEX "blackout_schedule_id_starts_on_ends_on_index" ON "blackout" USING btree ("schedule_id","starts_on","ends_on");--> statement-breakpoint
CREATE INDEX "course_term_id_index" ON "course" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "course_name_index" ON "course" USING btree ("name");--> statement-breakpoint
CREATE INDEX "term_term_name_index" ON "term" USING btree ("term_name");--> statement-breakpoint
CREATE INDEX "idx_logs_volunteer" ON "log" USING btree ("volunteer_user_id");--> statement-breakpoint
CREATE INDEX "idx_logs_course" ON "log" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_logs_created_at" ON "log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_logs_page" ON "log" USING btree ("page");--> statement-breakpoint
CREATE INDEX "instructor_to_schedule_instructor_user_id_index" ON "instructor_to_schedule" USING btree ("instructor_user_id");--> statement-breakpoint
CREATE INDEX "instructor_to_schedule_schedule_id_index" ON "instructor_to_schedule" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "schedule_course_id_index" ON "schedule" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "volunteer_to_schedule_volunteer_user_id_index" ON "volunteer_to_schedule" USING btree ("volunteer_user_id");--> statement-breakpoint
CREATE INDEX "volunteer_to_schedule_schedule_id_index" ON "volunteer_to_schedule" USING btree ("schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coverage_request_shift_id_requesting_volunteer_user_id_index" ON "coverage_request" USING btree ("shift_id","requesting_volunteer_user_id") WHERE "coverage_request"."status" = 'open'::coverage_status;--> statement-breakpoint
CREATE INDEX "coverage_request_shift_id_status_index" ON "coverage_request" USING btree ("shift_id","status");--> statement-breakpoint
CREATE INDEX "coverage_request_covered_by_volunteer_user_id_index" ON "coverage_request" USING btree ("covered_by_volunteer_user_id");--> statement-breakpoint
CREATE INDEX "coverage_request_requesting_volunteer_user_id_index" ON "coverage_request" USING btree ("requesting_volunteer_user_id");--> statement-breakpoint
CREATE INDEX "shift_class_id_index" ON "shift" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "shift_schedule_id_index" ON "shift" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_shift_date" ON "shift" USING btree ("date","class_id") WHERE not "shift"."canceled";--> statement-breakpoint
CREATE INDEX "idx_shift_start" ON "shift" USING btree ("start_at") WHERE not "shift"."canceled";--> statement-breakpoint
CREATE INDEX "idx_shift_slot" ON "shift" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "shift_attendance_user_id_index" ON "shift_attendance" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_preference_volunteer_user_id_course_rank_index" ON "course_preference" USING btree ("volunteer_user_id","course_rank");--> statement-breakpoint
CREATE INDEX "idx_user_email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_user_role" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_user_status" ON "user" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_created_at" ON "user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_volunteer_city" ON "volunteer" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_volunteer_province" ON "volunteer" USING btree ("province");--> statement-breakpoint
CREATE VIEW "public"."vw_instructor_user" AS (select "id", "name", "email", "email_verified", "image", "created_at", "updated_at", "role", "status", "last_name" from "user" where "user"."role" = 'instructor');--> statement-breakpoint
CREATE VIEW "public"."vw_volunteer_user" AS (select "user"."id", "user"."name", "user"."last_name", "user"."email", "user"."status", "user"."created_at", "user"."updated_at", "user"."email_verified", "user"."image", "user"."role", "volunteer"."preferred_name", "volunteer"."bio", "volunteer"."pronouns", "volunteer"."phone_number", "volunteer"."city", "volunteer"."province", "volunteer"."availability", "volunteer"."preferred_time_commitment_hours" from "user" inner join "volunteer" on "volunteer"."user_id" = "user"."id" where "user"."role" = 'volunteer');