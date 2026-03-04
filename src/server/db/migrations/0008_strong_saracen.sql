ALTER TABLE "course" DROP CONSTRAINT "chk_lower_level_bounds";--> statement-breakpoint
ALTER TABLE "course" DROP CONSTRAINT "chk_upper_level_bounds";--> statement-breakpoint
ALTER TABLE "course" ALTER COLUMN "lower_level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "course" ALTER COLUMN "upper_level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "chk_lower_level_bounds" CHECK ("course"."lower_level" IS NULL OR ("course"."lower_level" >= 1 AND "course"."lower_level" <= 4));--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "chk_upper_level_bounds" CHECK ("course"."upper_level" IS NULL OR ("course"."upper_level" >= 1 AND "course"."upper_level" <= 4));