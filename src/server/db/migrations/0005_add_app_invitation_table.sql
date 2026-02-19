CREATE TABLE "appInvitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"status" text NOT NULL,
	"inviter_id" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"domain_whitelist" text,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appInvitation" ADD CONSTRAINT "appInvitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appInvitation_inviter_id_index" ON "appInvitation" USING btree ("inviter_id");--> statement-breakpoint
CREATE INDEX "appInvitation_email_index" ON "appInvitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "appInvitation_status_index" ON "appInvitation" USING btree ("status");