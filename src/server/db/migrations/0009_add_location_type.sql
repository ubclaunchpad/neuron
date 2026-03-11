CREATE TYPE "public"."location_type" AS ENUM('InPerson', 'MeetingLink');--> statement-breakpoint
ALTER TABLE "course" RENAME COLUMN "meeting_url" TO "location";--> statement-breakpoint
ALTER TABLE "course" ADD COLUMN "location_type" "location_type";--> statement-breakpoint
UPDATE "course" SET "location_type" = 'MeetingLink' WHERE "location" IS NOT NULL;