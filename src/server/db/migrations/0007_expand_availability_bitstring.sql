DROP VIEW IF EXISTS "vw_volunteer_user";
--> statement-breakpoint
ALTER TABLE "volunteer" ALTER COLUMN "availability" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "volunteer" ALTER COLUMN "availability" TYPE bit(336) USING B'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
--> statement-breakpoint
ALTER TABLE "volunteer" ALTER COLUMN "availability" SET DEFAULT B'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
--> statement-breakpoint
ALTER TABLE "volunteer" ALTER COLUMN "availability" SET NOT NULL;
--> statement-breakpoint
CREATE VIEW "public"."vw_volunteer_user" AS (select "user"."id", "user"."name", "user"."last_name", "user"."email", "user"."status", "user"."created_at", "user"."updated_at", "user"."email_verified", "user"."image", "user"."role", "volunteer"."preferred_name", "volunteer"."bio", "volunteer"."pronouns", "volunteer"."phone_number", "volunteer"."city", "volunteer"."province", "volunteer"."availability", "volunteer"."preferred_time_commitment_hours" from "user" inner join "volunteer" on "volunteer"."user_id" = "user"."id" where "user"."role" = 'volunteer');