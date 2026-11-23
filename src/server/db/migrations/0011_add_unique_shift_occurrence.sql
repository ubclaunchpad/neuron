-- Reconcile any pre-existing duplicate shift rows sharing (schedule_id, date)
-- before enforcing the unique occurrence index.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "shift"
    GROUP BY "schedule_id", "date"
    HAVING COUNT(*) > 1
  ) THEN
    CREATE TEMP TABLE "_shift_dedup_map" AS
    WITH ranked_shifts AS (
      SELECT
        s."id",
        s."schedule_id",
        s."date",
        ROW_NUMBER() OVER (
          PARTITION BY s."schedule_id", s."date"
          ORDER BY
            (
              (SELECT COUNT(*) FROM "shift_attendance" sa WHERE sa."shift_id" = s."id")
              + (SELECT COUNT(*) FROM "coverage_request" cr WHERE cr."shift_id" = s."id" AND cr."status" <> 'withdrawn')
            ) DESC,
            s."canceled" ASC,
            s."id" ASC
        ) AS rn
      FROM "shift" s
      WHERE (s."schedule_id", s."date") IN (
        SELECT "schedule_id", "date"
        FROM "shift"
        GROUP BY "schedule_id", "date"
        HAVING COUNT(*) > 1
      )
    )
    SELECT
      dup."id" AS "duplicate_id",
      canon."id" AS "canonical_id"
    FROM ranked_shifts dup
    JOIN ranked_shifts canon
      ON canon."schedule_id" = dup."schedule_id"
     AND canon."date" = dup."date"
     AND canon.rn = 1
    WHERE dup.rn > 1;

    -- 1. Merge shift_attendance rows onto the canonical shift without colliding on (shift_id, user_id).
    INSERT INTO "shift_attendance" ("shift_id", "user_id", "status", "checked_in_at", "minutes_worked")
    SELECT DISTINCT ON (m."canonical_id", sa."user_id")
      m."canonical_id",
      sa."user_id",
      sa."status",
      sa."checked_in_at",
      sa."minutes_worked"
    FROM "shift_attendance" sa
    JOIN "_shift_dedup_map" m ON m."duplicate_id" = sa."shift_id"
    ORDER BY m."canonical_id", sa."user_id", sa."checked_in_at" ASC NULLS LAST, sa."shift_id" ASC
    ON CONFLICT ("shift_id", "user_id") DO NOTHING;

    -- 2. Resolve any active coverage_request collisions for the same
    --    (canonical_shift, requesting_volunteer_user_id) before repointing.
    --    Prefer resolved requests over open ones, then requests already on the
    --    canonical shift, then earliest requested_at.
    WITH ranked_active_coverage AS (
      SELECT
        cr."id",
        ROW_NUMBER() OVER (
          PARTITION BY COALESCE(m."canonical_id", cr."shift_id"), cr."requesting_volunteer_user_id"
          ORDER BY
            CASE WHEN cr."status" = 'resolved' THEN 0 ELSE 1 END ASC,
            CASE WHEN m."duplicate_id" IS NULL THEN 0 ELSE 1 END ASC,
            cr."requested_at" ASC,
            cr."id" ASC
        ) AS rn
      FROM "coverage_request" cr
      LEFT JOIN "_shift_dedup_map" m ON m."duplicate_id" = cr."shift_id"
      WHERE cr."status" <> 'withdrawn'
        AND (
          m."duplicate_id" IS NOT NULL
          OR cr."shift_id" IN (SELECT DISTINCT "canonical_id" FROM "_shift_dedup_map")
        )
    )
    UPDATE "coverage_request" cr
    SET "status" = 'withdrawn'
    FROM ranked_active_coverage rac
    WHERE cr."id" = rac."id"
      AND rac.rn > 1;

    -- 3. Repoint all coverage_request rows from duplicate shifts to the canonical shift.
    UPDATE "coverage_request" cr
    SET "shift_id" = m."canonical_id"
    FROM "_shift_dedup_map" m
    WHERE cr."shift_id" = m."duplicate_id";

    -- 4. Repoint shift-sourced notifications to the canonical shift.
    UPDATE "notification" n
    SET "source_id" = m."canonical_id"
    FROM "_shift_dedup_map" m
    WHERE n."source_type" = 'shift'
      AND n."source_id" = m."duplicate_id";

    -- 5. Remove duplicate shift rows (remaining redundant attendance rows cascade).
    DELETE FROM "shift" s
    USING "_shift_dedup_map" m
    WHERE s."id" = m."duplicate_id";

    DROP TABLE "_shift_dedup_map";
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_shift_schedule_date" ON "shift" USING btree ("schedule_id","date");
