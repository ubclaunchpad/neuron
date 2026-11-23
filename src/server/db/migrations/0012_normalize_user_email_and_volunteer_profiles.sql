DO $$
DECLARE
  collision_count integer;
BEGIN
  SELECT count(*) INTO collision_count
  FROM (
    SELECT lower(btrim("email"))
    FROM "user"
    GROUP BY lower(btrim("email"))
    HAVING count(*) > 1
  ) AS collisions;

  IF collision_count > 0 THEN
    RAISE EXCEPTION
      'Cannot enforce normalized email uniqueness: found % case/whitespace-colliding email group(s) in "user". Reconcile duplicates first (see docs/reconciliation/account-identity-and-profiles.md) before re-running migrations.',
      collision_count;
  END IF;
END $$;--> statement-breakpoint
UPDATE "user"
SET "email" = lower(btrim("email"))
WHERE "email" <> lower(btrim("email"));--> statement-breakpoint
UPDATE "appInvitation"
SET "email" = lower(btrim("email"))
WHERE "email" IS NOT NULL AND "email" <> lower(btrim("email"));--> statement-breakpoint
INSERT INTO "volunteer" ("user_id")
SELECT "id"
FROM "user"
WHERE "role" = 'volunteer'
ON CONFLICT ("user_id") DO NOTHING;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_email_normalized" ON "user" USING btree (lower(btrim("email")));
