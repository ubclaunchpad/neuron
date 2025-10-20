CREATE TABLE "instructor_to_schedule" (
	"instructor_user_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	CONSTRAINT "pk_instructor_schedule" PRIMARY KEY("instructor_user_id","schedule_id")
);
--> statement-breakpoint
ALTER TABLE "schedule" DROP CONSTRAINT "schedule_instructor_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "schedule_instructor_user_id_index";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'unverified';--> statement-breakpoint
ALTER TABLE "instructor_to_schedule" ADD CONSTRAINT "instructor_to_schedule_instructor_user_id_user_id_fk" FOREIGN KEY ("instructor_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_to_schedule" ADD CONSTRAINT "instructor_to_schedule_schedule_id_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "instructor_to_schedule_instructor_user_id_index" ON "instructor_to_schedule" USING btree ("instructor_user_id");--> statement-breakpoint
CREATE INDEX "instructor_to_schedule_schedule_id_index" ON "instructor_to_schedule" USING btree ("schedule_id");--> statement-breakpoint
ALTER TABLE "schedule" DROP COLUMN "instructor_user_id";--> statement-breakpoint
ALTER TABLE "public"."user" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."status";--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('unverified', 'rejected', 'active', 'inactive');--> statement-breakpoint
ALTER TABLE "public"."user" ALTER COLUMN "status" SET DATA TYPE "public"."status" USING "status"::"public"."status";