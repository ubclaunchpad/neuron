CREATE TYPE "public"."coverage_category" AS ENUM('emergency', 'health', 'conflict', 'transportation', 'other');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'instructor', 'volunteer');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('pending', 'active', 'inactive');--> statement-breakpoint
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
	"impersonated_by" uuid,
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
CREATE TABLE "course" (
	"course_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_id" uuid,
	"course_name" text NOT NULL,
	"instructions" text,
	"zoom_link" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"category" text,
	"subcategory" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_course_date_ok" CHECK ("course"."end_date" >= "course"."start_date")
);
--> statement-breakpoint
CREATE TABLE "image" (
	"image_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar(255),
	"mime_type" varchar(100),
	"data" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log" (
	"log_id" bigserial PRIMARY KEY NOT NULL,
	"page" text NOT NULL,
	"signoff" text NOT NULL,
	"description" text NOT NULL,
	"volunteer_user_id" uuid,
	"course_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coverage_request" (
	"request_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"category" "coverage_category" NOT NULL,
	"details" text NOT NULL,
	"comments" text,
	"covered_by_volunteer_user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "schedule" (
	"schedule_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"frequency" text NOT NULL,
	"instructor_user_id" uuid,
	CONSTRAINT "chk_schedule_day" CHECK ("schedule"."day_of_week" BETWEEN 0 AND 6),
	CONSTRAINT "chk_schedule_time" CHECK ("schedule"."end_time" > "schedule"."start_time")
);
--> statement-breakpoint
CREATE TABLE "shift" (
	"shift_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"volunteer_user_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"checked_in" boolean DEFAULT false NOT NULL,
	CONSTRAINT "chk_shift_time" CHECK ("shift"."end_at" > "shift"."start_at")
);
--> statement-breakpoint
CREATE TABLE "volunteer_to_schedule" (
	"volunteer_user_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	CONSTRAINT "pk_volunteer_schedule" PRIMARY KEY("volunteer_user_id","schedule_id")
);
--> statement-breakpoint
CREATE TABLE "admin" (
	"user_id" uuid PRIMARY KEY NOT NULL
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
CREATE TABLE "instructor" (
	"user_id" uuid PRIMARY KEY NOT NULL
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
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"last_name" text NOT NULL,
	"image_id" uuid,
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
	"availability" bit(672),
	"preferred_time_commitment_hours" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_impersonated_by_user_id_fk" FOREIGN KEY ("impersonated_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_image_id_image_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."image"("image_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log" ADD CONSTRAINT "log_volunteer_user_id_volunteer_user_id_fk" FOREIGN KEY ("volunteer_user_id") REFERENCES "public"."volunteer"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log" ADD CONSTRAINT "log_course_id_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_request" ADD CONSTRAINT "coverage_request_shift_id_shift_shift_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shift"("shift_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_request" ADD CONSTRAINT "coverage_request_covered_by_volunteer_user_id_volunteer_user_id_fk" FOREIGN KEY ("covered_by_volunteer_user_id") REFERENCES "public"."volunteer"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_course_id_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("course_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_instructor_user_id_instructor_user_id_fk" FOREIGN KEY ("instructor_user_id") REFERENCES "public"."instructor"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift" ADD CONSTRAINT "shift_volunteer_user_id_volunteer_user_id_fk" FOREIGN KEY ("volunteer_user_id") REFERENCES "public"."volunteer"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift" ADD CONSTRAINT "shift_schedule_id_schedule_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("schedule_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_to_schedule" ADD CONSTRAINT "volunteer_to_schedule_volunteer_user_id_volunteer_user_id_fk" FOREIGN KEY ("volunteer_user_id") REFERENCES "public"."volunteer"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_to_schedule" ADD CONSTRAINT "volunteer_to_schedule_schedule_id_schedule_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("schedule_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_preference" ADD CONSTRAINT "course_preference_volunteer_user_id_volunteer_user_id_fk" FOREIGN KEY ("volunteer_user_id") REFERENCES "public"."volunteer"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_preference" ADD CONSTRAINT "course_preference_schedule_id_schedule_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("schedule_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor" ADD CONSTRAINT "instructor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_image_id_image_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."image"("image_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer" ADD CONSTRAINT "volunteer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_image_id_index" ON "course" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "idx_logs_volunteer" ON "log" USING btree ("volunteer_user_id");--> statement-breakpoint
CREATE INDEX "idx_logs_course" ON "log" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_logs_created_at" ON "log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "coverage_request_shift_id_index" ON "coverage_request" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "coverage_request_covered_by_volunteer_user_id_index" ON "coverage_request" USING btree ("covered_by_volunteer_user_id");--> statement-breakpoint
CREATE INDEX "schedule_course_id_index" ON "schedule" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "schedule_instructor_user_id_index" ON "schedule" USING btree ("instructor_user_id");--> statement-breakpoint
CREATE INDEX "shift_volunteer_user_id_index" ON "shift" USING btree ("volunteer_user_id");--> statement-breakpoint
CREATE INDEX "shift_schedule_id_index" ON "shift" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "shift_start_at_index" ON "shift" USING btree ("start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_shifts_assignment" ON "shift" USING btree ("volunteer_user_id","schedule_id","start_at");--> statement-breakpoint
CREATE INDEX "volunteer_to_schedule_volunteer_user_id_index" ON "volunteer_to_schedule" USING btree ("volunteer_user_id");--> statement-breakpoint
CREATE INDEX "volunteer_to_schedule_schedule_id_index" ON "volunteer_to_schedule" USING btree ("schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_preference_volunteer_user_id_course_rank_index" ON "course_preference" USING btree ("volunteer_user_id","course_rank");