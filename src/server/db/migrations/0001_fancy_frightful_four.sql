ALTER TABLE "course_preference" DROP CONSTRAINT "chk_course_rank_positive";--> statement-breakpoint
ALTER TABLE "course_preference" DROP CONSTRAINT "course_preference_schedule_id_schedule_id_fk";
--> statement-breakpoint
DROP INDEX "course_preference_volunteer_user_id_course_rank_index";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'unverified';--> statement-breakpoint
ALTER TABLE "course_preference" ADD COLUMN "course_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "course_preference" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "course_preference" ADD CONSTRAINT "course_preference_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_preference" DROP COLUMN "schedule_id";--> statement-breakpoint
ALTER TABLE "course_preference" DROP COLUMN "course_rank";--> statement-breakpoint
ALTER TABLE "course_preference" DROP CONSTRAINT "pk_course_preferences";
--> statement-breakpoint
ALTER TABLE "course_preference" ADD CONSTRAINT "pk_course_preferences" PRIMARY KEY("volunteer_user_id","course_id");--> statement-breakpoint
ALTER TABLE "public"."user" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."status";--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('unverified', 'rejected', 'active', 'inactive');--> statement-breakpoint
ALTER TABLE "public"."user" ALTER COLUMN "status" SET DATA TYPE "public"."status" USING "status"::"public"."status";