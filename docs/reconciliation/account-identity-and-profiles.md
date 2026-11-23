# Account Identity & Profile Reconciliation Guide

This runbook documents how to audit and safely reconcile existing production data before applying migration `0012_normalize_user_email_and_volunteer_profiles.sql` (which enforces normalized email uniqueness via `uq_user_email_normalized` and backfills missing volunteer profiles).

## Invariants Enforced

1. **Normalized email identity**: All application writes store `lower(btrim(email))`, and Postgres enforces normalized uniqueness with `CREATE UNIQUE INDEX "uq_user_email_normalized" ON "user" (lower(btrim("email")))`.
2. **Role / volunteer profile parity**:
   - Every user with `role = 'volunteer'` MUST have a matching row in `"volunteer"`.
   - Users with `role IN ('admin', 'instructor')` MUST NOT have a stray row in `"volunteer"`.

## What Migration `0012` Does Automatically vs. Manually

Migration `0012_normalize_user_email_and_volunteer_profiles.sql` runs inside a single transaction and:

1. **Aborts immediately without modifying data** if any two `"user"` rows collide under `lower(btrim("email"))`.
2. Normalizes non-colliding `"user"."email"` and `"appInvitation"."email"` values using `lower(btrim("email"))`.
3. Backfills missing `"volunteer"` rows for existing `role = 'volunteer'` users (`ON CONFLICT ("user_id") DO NOTHING`).
4. Creates `uq_user_email_normalized` on `"user" (lower(btrim("email")))`.

It intentionally does **not** auto-delete colliding user rows or stray `"volunteer"` rows on non-volunteer accounts, because those may carry authentication credentials, active sessions, or historical shift/attendance records (`shift_attendance.user_id` uses `ON DELETE RESTRICT`).

---

## Step 1: Read-Only Preflight Audit

Run these read-only queries against Postgres before running migrations.

### 1.1 Find case/whitespace-colliding user emails

```sql
SELECT
  lower(btrim(u.email)) AS normalized_email,
  u.id,
  u.email AS raw_email,
  u.role,
  u.status,
  u.email_verified,
  u.created_at,
  (SELECT count(*) FROM "account" a WHERE a.user_id = u.id) AS auth_accounts,
  (SELECT count(*) FROM "session" s WHERE s.user_id = u.id) AS sessions,
  EXISTS (SELECT 1 FROM "volunteer" v WHERE v.user_id = u.id) AS has_volunteer_profile,
  (SELECT count(*) FROM "volunteer_to_schedule" vs WHERE vs.volunteer_user_id = u.id) AS volunteer_schedules,
  (SELECT count(*) FROM "instructor_to_schedule" ins WHERE ins.instructor_user_id = u.id) AS instructor_schedules,
  (SELECT count(*) FROM "shift_attendance" sa WHERE sa.user_id = u.id) AS attendance_rows
FROM "user" u
WHERE lower(btrim(u.email)) IN (
  SELECT lower(btrim(email))
  FROM "user"
  GROUP BY lower(btrim(email))
  HAVING count(*) > 1
)
ORDER BY normalized_email, u.created_at;
```

### 1.2 Find non-colliding unnormalized emails (informational — handled by migration `0012`)

```sql
SELECT id, email, lower(btrim(email)) AS normalized_email
FROM "user"
WHERE email <> lower(btrim(email));

SELECT id, email, status, lower(btrim(email)) AS normalized_email
FROM "appInvitation"
WHERE email IS NOT NULL AND email <> lower(btrim(email));
```

### 1.3 Find duplicate pending invitations sharing a normalized email

```sql
SELECT
  lower(btrim(email)) AS normalized_email,
  count(*) AS pending_count,
  array_agg(id ORDER BY created_at DESC) AS invitation_ids
FROM "appInvitation"
WHERE email IS NOT NULL AND status = 'pending'
GROUP BY lower(btrim(email))
HAVING count(*) > 1;
```

### 1.4 Find malformed profiles

Volunteers missing a `"volunteer"` profile row (automatically backfilled by migration `0012`):

```sql
SELECT u.id, u.email, u.status, u.created_at
FROM "user" u
LEFT JOIN "volunteer" v ON v.user_id = u.id
WHERE u.role = 'volunteer'
  AND v.user_id IS NULL;
```

Non-volunteers with a stray `"volunteer"` profile row (requires manual review):

```sql
SELECT
  u.id,
  u.email,
  u.role,
  u.status,
  (SELECT count(*) FROM "shift_attendance" sa WHERE sa.user_id = u.id) AS attendance_rows,
  (SELECT count(*) FROM "volunteer_to_schedule" vs WHERE vs.volunteer_user_id = u.id) AS volunteer_schedules,
  (SELECT count(*) FROM "coverage_request" cr WHERE cr.requesting_volunteer_user_id = u.id OR cr.covered_by_volunteer_user_id = u.id) AS coverage_requests,
  (SELECT count(*) FROM "course_preference" cp WHERE cp.volunteer_user_id = u.id) AS course_preferences,
  (SELECT count(*) FROM "log" l WHERE l.volunteer_user_id = u.id) AS log_rows
FROM "user" u
INNER JOIN "volunteer" v ON v.user_id = u.id
WHERE u.role <> 'volunteer';
```

---

## Step 2: Reconciling Case-Colliding Emails

For each colliding group returned by query 1.1:

1. **Choose the canonical user (`<KEEP_ID>`)** — normally the row that has credentials (`auth_accounts > 0`), `email_verified = true`, active status, or operational history (schedules/attendance).
2. **Choose the duplicate user (`<DUP_ID>`)** and inspect all foreign-key references before taking action.
3. **Run the reconciliation inside an explicit transaction**:
   - **Case A — Duplicate has no operational history and no credentials** (e.g., an unused direct-created duplicate):
     ```sql
     BEGIN;
     -- Reassign any notifications/invitations if needed, then delete the unused duplicate.
     DELETE FROM "user" WHERE id = '<DUP_ID>';
     UPDATE "user" SET email = lower(btrim(email)) WHERE id = '<KEEP_ID>';
     COMMIT;
     ```
   - **Case B — Duplicate has historical records that must be retained** (such as `shift_attendance`, `instructor_to_schedule`, `coverage_request`, or `log`):
     1. Re-point foreign keys from `<DUP_ID>` to `<KEEP_ID>` where compatible (checking primary-key conflicts on `instructor_to_schedule`, `volunteer_to_schedule`, `shift_attendance`, `course_preference`, and `notification_preference`).
     2. Ensure `<KEEP_ID>` has a `"volunteer"` row before migrating volunteer-scoped FKs.
     3. If a duplicate account cannot be merged immediately, revoke its sessions, mark it `inactive`, and assign a unique archived placeholder email (for example, `archived+<DUP_ID>@invalid.local`) so the canonical user owns the real normalized address:
        ```sql
        BEGIN;
        DELETE FROM "session" WHERE user_id = '<DUP_ID>';
        UPDATE "user"
        SET status = 'inactive',
            email = 'archived+' || id::text || '@invalid.local'
        WHERE id = '<DUP_ID>';
        UPDATE "user"
        SET email = lower(btrim(email))
        WHERE id = '<KEEP_ID>';
        COMMIT;
        ```

---

## Step 3: Reconciling Malformed Profiles & Duplicate Invitations

### 3.1 Missing volunteer profiles

Migration `0012` backfills these automatically. If you want to repair them ahead of the migration:

```sql
INSERT INTO "volunteer" ("user_id")
SELECT "id"
FROM "user"
WHERE "role" = 'volunteer'
ON CONFLICT ("user_id") DO NOTHING;
```

### 3.2 Stray volunteer profiles on non-volunteer accounts

Only delete stray rows with zero historical references (or after migrating/archiving those references):

```sql
DELETE FROM "volunteer" v
USING "user" u
WHERE v.user_id = u.id
  AND u.role <> 'volunteer'
  AND NOT EXISTS (SELECT 1 FROM "shift_attendance" sa WHERE sa.user_id = v.user_id)
  AND NOT EXISTS (SELECT 1 FROM "volunteer_to_schedule" vs WHERE vs.volunteer_user_id = v.user_id)
  AND NOT EXISTS (
    SELECT 1 FROM "coverage_request" cr
    WHERE cr.requesting_volunteer_user_id = v.user_id
       OR cr.covered_by_volunteer_user_id = v.user_id
  )
  AND NOT EXISTS (SELECT 1 FROM "course_preference" cp WHERE cp.volunteer_user_id = v.user_id)
  AND NOT EXISTS (SELECT 1 FROM "log" l WHERE l.volunteer_user_id = v.user_id);
```

If any non-volunteer still has referenced `"volunteer"` rows, confirm whether the account should actually be `role = 'volunteer'` or whether historical attendance/coverage records should remain archived before removing the stray profile.

### 3.3 Duplicate pending invitations

Expire older duplicate pending invitations, keeping only the newest pending invitation per normalized email:

```sql
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY lower(btrim(email))
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM "appInvitation"
  WHERE email IS NOT NULL AND status = 'pending'
)
UPDATE "appInvitation"
SET status = 'expired'
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
```

---

## Step 4: Verify and Apply Migrations

1. Re-run queries **1.1**, **1.3**, and **1.4** and confirm zero rows are returned.
2. Run migrations:
   ```bash
   pnpm db:migrate
   ```
3. Confirm the normalized unique index is present:
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'user' AND indexname = 'uq_user_email_normalized';
   ```
