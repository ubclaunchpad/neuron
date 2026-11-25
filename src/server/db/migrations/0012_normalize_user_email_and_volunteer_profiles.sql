-- Trim the same whitespace characters as JavaScript String.trim().
DO $$
DECLARE
  collision_count integer;
BEGIN
  SELECT count(*) INTO collision_count
  FROM (
    SELECT lower(btrim("email", U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'))
    FROM "user"
    GROUP BY lower(btrim("email", U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'))
    HAVING count(*) > 1
  ) AS collisions;

  IF collision_count > 0 THEN
    RAISE EXCEPTION
      'Cannot enforce normalized email uniqueness: found % case/whitespace-colliding email group(s) in "user". Audit normalized email groups with count(*) > 1; select a verified owner and merge references or assign distinct verified addresses before re-running migrations.',
      collision_count;
  END IF;
END $$;--> statement-breakpoint
UPDATE "user"
SET "email" = lower(btrim("email", U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'))
WHERE "email" <> lower(btrim("email", U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'));--> statement-breakpoint
UPDATE "appInvitation"
SET "email" = lower(btrim("email", U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'))
WHERE "email" IS NOT NULL AND "email" <> lower(btrim("email", U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'));--> statement-breakpoint
INSERT INTO "volunteer" ("user_id")
SELECT "id"
FROM "user"
WHERE "role" = 'volunteer'
ON CONFLICT ("user_id") DO NOTHING;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_email_normalized" ON "user" USING btree (lower(btrim("email", U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')));
