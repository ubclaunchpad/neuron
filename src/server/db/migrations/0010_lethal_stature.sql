CREATE TYPE "public"."notification_channel" AS ENUM('email', 'in_app', 'push');--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"link_url" text,
	"source_type" text,
	"source_id" uuid,
	"actor_id" uuid,
	"read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text,
	CONSTRAINT "notification_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "notification_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"enabled" boolean NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notification_user_created" ON "notification" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_notification_user_read" ON "notification" USING btree ("user_id","read");--> statement-breakpoint
CREATE INDEX "idx_notification_type" ON "notification" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_notification_source" ON "notification" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_notification_pref_user_type_channel" ON "notification_preference" USING btree ("user_id","type","channel");--> statement-breakpoint
CREATE INDEX "idx_notification_pref_user" ON "notification_preference" USING btree ("user_id");