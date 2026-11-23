CREATE TABLE "delivery_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_key" text,
	"revision_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"last_error_code" text,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "delivery_outbox_delivery_key_unique" UNIQUE("delivery_key")
);
--> statement-breakpoint
CREATE INDEX "delivery_outbox_pending_idx" ON "delivery_outbox" USING btree ("next_attempt_at") WHERE "delivery_outbox"."processed_at" IS NULL AND "delivery_outbox"."failed_at" IS NULL;