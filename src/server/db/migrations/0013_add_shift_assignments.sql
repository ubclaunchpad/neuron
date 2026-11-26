CREATE TABLE "shift_instructor_assignment" (
	"shift_id" uuid NOT NULL,
	"instructor_user_id" uuid NOT NULL,
	CONSTRAINT "pk_shift_instructor_assignment" PRIMARY KEY("shift_id","instructor_user_id")
);
--> statement-breakpoint
CREATE TABLE "shift_volunteer_assignment" (
	"shift_id" uuid NOT NULL,
	"volunteer_user_id" uuid NOT NULL,
	CONSTRAINT "pk_shift_volunteer_assignment" PRIMARY KEY("shift_id","volunteer_user_id")
);
--> statement-breakpoint
ALTER TABLE "shift_instructor_assignment" ADD CONSTRAINT "shift_instructor_assignment_shift_id_shift_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shift"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_instructor_assignment" ADD CONSTRAINT "shift_instructor_assignment_instructor_user_id_user_id_fk" FOREIGN KEY ("instructor_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_volunteer_assignment" ADD CONSTRAINT "shift_volunteer_assignment_shift_id_shift_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shift"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_volunteer_assignment" ADD CONSTRAINT "shift_volunteer_assignment_volunteer_user_id_volunteer_user_id_fk" FOREIGN KEY ("volunteer_user_id") REFERENCES "public"."volunteer"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_shift_instructor_assignment_instructor" ON "shift_instructor_assignment" USING btree ("instructor_user_id");--> statement-breakpoint
CREATE INDEX "idx_shift_volunteer_assignment_volunteer" ON "shift_volunteer_assignment" USING btree ("volunteer_user_id");--> statement-breakpoint
INSERT INTO "shift_volunteer_assignment" ("shift_id", "volunteer_user_id")
SELECT s."id", vts."volunteer_user_id"
FROM "shift" s
INNER JOIN "volunteer_to_schedule" vts ON vts."schedule_id" = s."schedule_id"
WHERE NOT EXISTS (
	SELECT 1 FROM "coverage_request" cr
	WHERE cr."shift_id" = s."id"
		AND cr."covered_by_volunteer_user_id" = vts."volunteer_user_id"
		AND cr."status" = 'resolved'
)
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "shift_volunteer_assignment" ("shift_id", "volunteer_user_id")
SELECT sa."shift_id", sa."user_id"
FROM "shift_attendance" sa
WHERE NOT EXISTS (
	SELECT 1 FROM "coverage_request" cr
	WHERE cr."shift_id" = sa."shift_id"
		AND cr."covered_by_volunteer_user_id" = sa."user_id"
		AND cr."status" = 'resolved'
)
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "shift_volunteer_assignment" ("shift_id", "volunteer_user_id")
SELECT cr."shift_id", cr."requesting_volunteer_user_id"
FROM "coverage_request" cr
WHERE cr."status" = 'resolved'
	AND cr."covered_by_volunteer_user_id" IS NOT NULL
	AND NOT EXISTS (
		SELECT 1 FROM "coverage_request" cr_prev
		WHERE cr_prev."shift_id" = cr."shift_id"
			AND cr_prev."covered_by_volunteer_user_id" = cr."requesting_volunteer_user_id"
			AND cr_prev."status" = 'resolved'
			AND (cr_prev."requested_at", cr_prev."id") < (cr."requested_at", cr."id")
	)
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "shift_instructor_assignment" ("shift_id", "instructor_user_id")
SELECT s."id", its."instructor_user_id"
FROM "shift" s
INNER JOIN "instructor_to_schedule" its ON its."schedule_id" = s."schedule_id"
ON CONFLICT DO NOTHING;