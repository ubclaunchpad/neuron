ALTER TABLE "notification" ADD COLUMN "archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_notification_user_archived" ON "notification" USING btree ("user_id","archived");