ALTER TABLE "coverage_request" ADD COLUMN IF NOT EXISTS "requested_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "coverage_request"
SET "requested_at" = now()
WHERE "requested_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "coverage_request" ALTER COLUMN "requested_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "coverage_request" ALTER COLUMN "requested_at" SET NOT NULL;
