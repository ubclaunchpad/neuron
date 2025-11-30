ALTER TABLE "schedule" ADD COLUMN "preferred_volunteer_count" smallint DEFAULT 0;--> statement-breakpoint
ALTER TABLE "schedule" ALTER COLUMN "preferred_volunteer_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule" ALTER COLUMN "preferred_volunteer_count" DROP DEFAULT;--> statement-breakpoint
