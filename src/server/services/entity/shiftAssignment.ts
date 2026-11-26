import { CoverageStatus } from "@/models/api/coverage";
import { UserStatus } from "@/models/interfaces";
import type { Drizzle, Transaction } from "@/server/db";
import {
  instructorToSchedule,
  volunteerToSchedule,
} from "@/server/db/schema/schedule";
import {
  coverageRequest,
  shift,
  shiftAttendance,
  shiftInstructorAssignment,
  shiftVolunteerAssignment,
} from "@/server/db/schema/shift";
import { user } from "@/server/db/schema/user";
import {
  aliasedTable,
  and,
  eq,
  exists,
  gt,
  inArray,
  isNotNull,
  lt,
  not,
  sql,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";

/**
 * Shared per-shift effective assignment contract.
 *
 * Design decision (per-shift snapshots vs. effective-dated schedule rows):
 * - Chosen: per-shift base snapshots (`shift_volunteer_assignment`,
 *   `shift_instructor_assignment`) plus resolved `coverage_request` transfers.
 *   Shifts are already materialized on publish; snapshotting avoids surrogate PKs
 *   and non-overlapping interval constraints on schedule join tables, handles
 *   backdated shifts, and keeps `coverage_request` as the substitution source.
 * - Migration backfill (`0013_add_shift_assignments.sql`) reconstructs prior
 *   shifts from current schedule membership, existing `shift_attendance` rows,
 *   and resolved `coverage_request` origins; pre-migration schedule removals
 *   without attendance or coverage history cannot be reconstructed retroactively.
 *   Original base slots and later schedule additions can be indistinguishable;
 *   request creation order is only a backfill heuristic, not fulfillment order.
 * - Schedule edits sync only future, non-canceled shifts (`start_at > now AND
 *   NOT canceled`). Base slots on future shifts are retained on removal only
 *   when the volunteer already has `shift_attendance` (early check-in) or when
 *   removing the base slot would drop their net slot count below 0 (their base
 *   slot was already transferred to a covering volunteer).
 *   Re-adding a released volunteer does not grant a second base slot or revoke
 *   their resolved substitute: the existing transfer still applies to that shift.
 * - Effective membership rule (net slot conservation):
 *     net(shift, volunteer) =
 *       base(shift, volunteer)
 *       + count(resolved coverage where covered_by_volunteer_user_id = volunteer)
 *       - count(resolved coverage where requesting_volunteer_user_id = volunteer
 *               and covered_by_volunteer_user_id IS NOT NULL)
 *   A volunteer is effectively assigned iff `net(shift, volunteer) > 0`.
 *   Open and withdrawn coverage requests do not transfer assignment.
 */

export type ShiftAssignmentDb = Drizzle | Transaction;

export type ResolvedCoverageEdge = {
  id: string;
  shiftId: string;
  requestedAt: Date;
  requestingVolunteerUserId: string;
  coveredByVolunteerUserId: string;
};

export type EffectiveShiftVolunteerAssignment = {
  shiftId: string;
  volunteerUserId: string;
  /** Requester for remaining net incoming coverage; null for a base-only net slot. */
  coveringForVolunteerUserId: string | null;
};

export type EffectiveShiftVolunteerUser = EffectiveShiftVolunteerAssignment & {
  name: string;
  lastName: string;
  email: string;
  status: UserStatus;
};

export type ShiftParticipantRecipient = {
  userId: string;
  email: string;
};

/**
 * Pure effective-roster resolver for a single shift (`net > 0`).
 * Deterministic regardless of input row order for single, chained (A -> B -> C),
 * and round-trip (A -> B -> A) substitutions.
 */
export function resolveEffectiveShiftVolunteers(
  shiftId: string,
  baseVolunteerIds: readonly string[],
  resolvedCoverages: readonly ResolvedCoverageEdge[],
): EffectiveShiftVolunteerAssignment[] {
  const baseSet = new Set(baseVolunteerIds);
  const sortedCoverages = [...resolvedCoverages].sort((a, b) => {
    const timeDiff = a.requestedAt.getTime() - b.requestedAt.getTime();
    return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
  });

  const incomingByVolunteer = new Map<string, ResolvedCoverageEdge[]>();
  const outgoingCountByVolunteer = new Map<string, number>();
  const candidateOrder: string[] = [];
  const seenCandidates = new Set<string>();

  const registerCandidate = (volunteerUserId: string) => {
    if (!seenCandidates.has(volunteerUserId)) {
      seenCandidates.add(volunteerUserId);
      candidateOrder.push(volunteerUserId);
    }
  };

  for (const volunteerId of baseVolunteerIds) {
    registerCandidate(volunteerId);
  }

  for (const coverage of sortedCoverages) {
    registerCandidate(coverage.requestingVolunteerUserId);
    registerCandidate(coverage.coveredByVolunteerUserId);

    outgoingCountByVolunteer.set(
      coverage.requestingVolunteerUserId,
      (outgoingCountByVolunteer.get(coverage.requestingVolunteerUserId) ?? 0) +
        1,
    );

    const incoming =
      incomingByVolunteer.get(coverage.coveredByVolunteerUserId) ?? [];
    incoming.push(coverage);
    incomingByVolunteer.set(coverage.coveredByVolunteerUserId, incoming);
  }

  const effective: EffectiveShiftVolunteerAssignment[] = [];
  for (const volunteerUserId of candidateOrder) {
    const baseCount = baseSet.has(volunteerUserId) ? 1 : 0;
    const incoming = incomingByVolunteer.get(volunteerUserId) ?? [];
    const outgoingCount = outgoingCountByVolunteer.get(volunteerUserId) ?? 0;

    if (baseCount + incoming.length - outgoingCount > 0) {
      const latestIncoming = incoming[incoming.length - 1] ?? null;
      effective.push({
        shiftId,
        volunteerUserId,
        coveringForVolunteerUserId:
          incoming.length > outgoingCount
            ? (latestIncoming?.requestingVolunteerUserId ?? null)
            : null,
      });
    }
  }

  return effective;
}

/**
 * Resolve effective volunteer assignments for multiple shifts from already-loaded
 * base volunteer IDs and resolved coverage edges.
 */
export function resolveEffectiveVolunteerAssignmentsByShift(
  shiftIds: readonly string[],
  baseByShift: ReadonlyMap<string, readonly string[]>,
  resolvedCoverages: readonly ResolvedCoverageEdge[],
): Map<string, EffectiveShiftVolunteerAssignment[]> {
  const resolvedByShift = new Map<string, ResolvedCoverageEdge[]>();
  for (const edge of resolvedCoverages) {
    const list = resolvedByShift.get(edge.shiftId) ?? [];
    list.push(edge);
    resolvedByShift.set(edge.shiftId, list);
  }

  const result = new Map<string, EffectiveShiftVolunteerAssignment[]>();
  for (const shiftId of shiftIds) {
    const baseIds = [...(baseByShift.get(shiftId) ?? [])].sort();
    result.set(
      shiftId,
      resolveEffectiveShiftVolunteers(
        shiftId,
        baseIds,
        resolvedByShift.get(shiftId) ?? [],
      ),
    );
  }

  return result;
}

// Net transfers, shared by visibility checks and base-slot removal guards.
function resolvedCoverageBalanceSql(
  shiftIdColumn: SQLWrapper,
  volunteerUserId: string | SQLWrapper,
): SQL<number> {
  const cr = aliasedTable(coverageRequest, "cr_balance");
  return sql<number>`(
    SELECT COALESCE(SUM(
      CASE WHEN ${cr.coveredByVolunteerUserId} = ${volunteerUserId} THEN 1 ELSE 0 END
      - CASE WHEN ${cr.requestingVolunteerUserId} = ${volunteerUserId} THEN 1 ELSE 0 END
    ), 0)::int
    FROM ${coverageRequest} AS ${cr}
    WHERE ${cr.shiftId} = ${shiftIdColumn}
      AND ${cr.status} = ${CoverageStatus.resolved}
      AND ${cr.coveredByVolunteerUserId} IS NOT NULL
  )`;
}

/**
 * SQL predicate equivalent to `resolveEffectiveShiftVolunteers` (`net > 0`).
 */
export function isVolunteerEffectivelyAssignedToShiftSql(
  shiftIdColumn: SQLWrapper,
  volunteerUserId: string | SQLWrapper,
): SQL<boolean> {
  const sva = aliasedTable(shiftVolunteerAssignment, "sva");

  return sql<boolean>`(
    (CASE WHEN EXISTS (
      SELECT 1 FROM ${shiftVolunteerAssignment} AS ${sva}
      WHERE ${sva.shiftId} = ${shiftIdColumn}
        AND ${sva.volunteerUserId} = ${volunteerUserId}
    ) THEN 1 ELSE 0 END)
    + ${resolvedCoverageBalanceSql(shiftIdColumn, volunteerUserId)}
  ) > 0`;
}

/**
 * SQL predicate for whether an instructor is assigned to a specific shift.
 */
export function isInstructorAssignedToShiftSql(
  shiftIdColumn: SQLWrapper,
  instructorUserId: string | SQLWrapper,
): SQL<boolean> {
  const sia = aliasedTable(shiftInstructorAssignment, "sia");
  return sql<boolean>`EXISTS (
    SELECT 1 FROM ${shiftInstructorAssignment} AS ${sia}
    WHERE ${sia.shiftId} = ${shiftIdColumn}
      AND ${sia.instructorUserId} = ${instructorUserId}
  )`;
}

/**
 * Load base per-shift volunteer IDs for one or more shifts.
 */
export async function getBaseVolunteerAssignmentsForShifts(
  db: ShiftAssignmentDb,
  shiftIds: string[],
): Promise<Map<string, string[]>> {
  const baseByShift = new Map<string, string[]>();
  const uniqueShiftIds = [...new Set(shiftIds)];
  if (uniqueShiftIds.length === 0) return baseByShift;

  const baseRows = await db
    .select({
      shiftId: shiftVolunteerAssignment.shiftId,
      volunteerUserId: shiftVolunteerAssignment.volunteerUserId,
    })
    .from(shiftVolunteerAssignment)
    .where(inArray(shiftVolunteerAssignment.shiftId, uniqueShiftIds));

  for (const row of baseRows) {
    const list = baseByShift.get(row.shiftId) ?? [];
    list.push(row.volunteerUserId);
    baseByShift.set(row.shiftId, list);
  }

  return baseByShift;
}

/**
 * Load effective volunteer assignments for one or more shifts.
 */
export async function getEffectiveVolunteerAssignmentsForShifts(
  db: ShiftAssignmentDb,
  shiftIds: string[],
): Promise<Map<string, EffectiveShiftVolunteerAssignment[]>> {
  const uniqueShiftIds = [...new Set(shiftIds)];
  if (uniqueShiftIds.length === 0) {
    return new Map();
  }

  const [baseByShift, resolvedCoverageRows] = await Promise.all([
    getBaseVolunteerAssignmentsForShifts(db, uniqueShiftIds),
    db
      .select({
        id: coverageRequest.id,
        shiftId: coverageRequest.shiftId,
        requestedAt: coverageRequest.requestedAt,
        requestingVolunteerUserId: coverageRequest.requestingVolunteerUserId,
        coveredByVolunteerUserId: coverageRequest.coveredByVolunteerUserId,
      })
      .from(coverageRequest)
      .where(
        and(
          inArray(coverageRequest.shiftId, uniqueShiftIds),
          eq(coverageRequest.status, CoverageStatus.resolved),
          isNotNull(coverageRequest.coveredByVolunteerUserId),
        ),
      ),
  ]);

  const resolvedEdges: ResolvedCoverageEdge[] = [];
  for (const row of resolvedCoverageRows) {
    if (!row.coveredByVolunteerUserId) continue;
    resolvedEdges.push({
      id: row.id,
      shiftId: row.shiftId,
      requestedAt: row.requestedAt,
      requestingVolunteerUserId: row.requestingVolunteerUserId,
      coveredByVolunteerUserId: row.coveredByVolunteerUserId,
    });
  }

  return resolveEffectiveVolunteerAssignmentsByShift(
    uniqueShiftIds,
    baseByShift,
    resolvedEdges,
  );
}

/**
 * Load per-shift instructor user IDs for one or more shifts.
 */
export async function getShiftInstructorAssignmentsForShifts(
  db: ShiftAssignmentDb,
  shiftIds: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  const uniqueShiftIds = [...new Set(shiftIds)];
  if (uniqueShiftIds.length === 0) return result;

  const rows = await db
    .select({
      shiftId: shiftInstructorAssignment.shiftId,
      instructorUserId: shiftInstructorAssignment.instructorUserId,
    })
    .from(shiftInstructorAssignment)
    .where(inArray(shiftInstructorAssignment.shiftId, uniqueShiftIds));

  for (const shiftId of uniqueShiftIds) {
    result.set(shiftId, []);
  }
  for (const row of rows) {
    result.get(row.shiftId)!.push(row.instructorUserId);
  }
  for (const ids of result.values()) {
    ids.sort();
  }

  return result;
}

/**
 * Load effective volunteers for a single shift enriched with basic user info.
 * Used by reminder and no-checkin notification jobs.
 */
export async function getEffectiveVolunteerUsersForShift(
  db: ShiftAssignmentDb,
  shiftId: string,
  options?: { activeOnly?: boolean },
): Promise<EffectiveShiftVolunteerUser[]> {
  const activeOnly = options?.activeOnly ?? false;
  const assignments =
    (await getEffectiveVolunteerAssignmentsForShifts(db, [shiftId])).get(
      shiftId,
    ) ?? [];
  if (assignments.length === 0) return [];

  const userIds = assignments.map((a) => a.volunteerUserId);
  const userRows = await db
    .select({
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
    })
    .from(user)
    .where(
      activeOnly
        ? and(inArray(user.id, userIds), eq(user.status, UserStatus.active))
        : inArray(user.id, userIds),
    );

  const usersById = new Map(userRows.map((u) => [u.id, u] as const));
  return assignments.flatMap((assignment) => {
    const u = usersById.get(assignment.volunteerUserId);
    return u
      ? [
          {
            ...assignment,
            name: u.name,
            lastName: u.lastName,
            email: u.email,
            status: u.status,
          },
        ]
      : [];
  });
}

/**
 * Resolve active shift notification recipients (effective volunteers + assigned
 * instructors) for a shift, deduplicated by user ID.
 */
export async function getEffectiveShiftNotificationRecipients(
  db: ShiftAssignmentDb,
  shiftId: string,
): Promise<ShiftParticipantRecipient[]> {
  const [volunteersByShift, instructorsByShift] = await Promise.all([
    getEffectiveVolunteerAssignmentsForShifts(db, [shiftId]),
    getShiftInstructorAssignmentsForShifts(db, [shiftId]),
  ]);

  const participantUserIds = [
    ...new Set([
      ...(volunteersByShift.get(shiftId) ?? []).map((v) => v.volunteerUserId),
      ...(instructorsByShift.get(shiftId) ?? []),
    ]),
  ];
  if (participantUserIds.length === 0) return [];

  return db
    .select({
      userId: user.id,
      email: user.email,
    })
    .from(user)
    .where(
      and(
        inArray(user.id, participantUserIds),
        eq(user.status, UserStatus.active),
      ),
    );
}

/**
 * Find volunteers from `volunteerUserIds` who have an effective assignment on
 * any non-canceled shift overlapping `[startAt, endAt)`.
 */
export async function getConflictingEffectiveVolunteerIds(
  db: ShiftAssignmentDb,
  params: {
    volunteerUserIds: string[];
    startAt: Date;
    endAt: Date;
  },
): Promise<Set<string>> {
  const { volunteerUserIds, startAt, endAt } = params;
  if (volunteerUserIds.length === 0) return new Set();
  const conflicting = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(
        inArray(user.id, volunteerUserIds),
        exists(
          db
            .select({ id: shift.id })
            .from(shift)
            .where(
              and(
                lt(shift.startAt, endAt),
                gt(shift.endAt, startAt),
                eq(shift.canceled, false),
                isVolunteerEffectivelyAssignedToShiftSql(shift.id, user.id),
              ),
            ),
        ),
      ),
    );
  return new Set(conflicting.map((row) => row.id));
}

/**
 * Snapshot a schedule's current volunteer and instructor assignments onto a
 * newly created shift.
 */
export async function snapshotScheduleAssignmentsToShift(
  db: ShiftAssignmentDb,
  shiftId: string,
  scheduleId: string,
): Promise<void> {
  await Promise.all([
    db.execute(sql`
      INSERT INTO ${shiftVolunteerAssignment} ("shift_id", "volunteer_user_id")
      SELECT ${shiftId}, ${volunteerToSchedule.volunteerUserId}
      FROM ${volunteerToSchedule}
      WHERE ${volunteerToSchedule.scheduleId} = ${scheduleId}
      ON CONFLICT DO NOTHING
    `),
    db.execute(sql`
      INSERT INTO ${shiftInstructorAssignment} ("shift_id", "instructor_user_id")
      SELECT ${shiftId}, ${instructorToSchedule.instructorUserId}
      FROM ${instructorToSchedule}
      WHERE ${instructorToSchedule.scheduleId} = ${scheduleId}
      ON CONFLICT DO NOTHING
    `),
  ]);
}

/**
 * Propagate schedule roster edits to future, non-canceled shifts only.
 * Historical (`startAt <= now`) and canceled shifts keep their exact snapshots.
 */
export async function syncScheduleAssignmentsToFutureShifts(
  db: ShiftAssignmentDb,
  params: {
    scheduleId: string;
    addedVolunteerUserIds?: string[];
    removedVolunteerUserIds?: string[];
    addedInstructorUserIds?: string[];
    removedInstructorUserIds?: string[];
    now?: Date;
  },
): Promise<void> {
  const addedVolunteers = [...new Set(params.addedVolunteerUserIds ?? [])];
  const removedVolunteers = [...new Set(params.removedVolunteerUserIds ?? [])];
  const addedInstructors = [...new Set(params.addedInstructorUserIds ?? [])];
  const removedInstructors = [
    ...new Set(params.removedInstructorUserIds ?? []),
  ];

  if (
    addedVolunteers.length === 0 &&
    removedVolunteers.length === 0 &&
    addedInstructors.length === 0 &&
    removedInstructors.length === 0
  ) {
    return;
  }

  const now = params.now ?? new Date();
  const futureShifts = await db
    .select({ id: shift.id })
    .from(shift)
    .where(
      and(
        eq(shift.scheduleId, params.scheduleId),
        gt(shift.startAt, now),
        eq(shift.canceled, false),
      ),
    )
    .for("update");

  const futureShiftIds = futureShifts.map((s) => s.id);
  if (futureShiftIds.length === 0) return;

  if (addedVolunteers.length > 0) {
    const effectiveByShift = await getEffectiveVolunteerAssignmentsForShifts(
      db,
      futureShiftIds,
    );

    const rowsToInsert: { shiftId: string; volunteerUserId: string }[] = [];
    for (const shiftId of futureShiftIds) {
      const effectiveIds = new Set(
        (effectiveByShift.get(shiftId) ?? []).map((a) => a.volunteerUserId),
      );
      for (const volunteerUserId of addedVolunteers) {
        if (!effectiveIds.has(volunteerUserId)) {
          rowsToInsert.push({ shiftId, volunteerUserId });
        }
      }
    }

    if (rowsToInsert.length > 0) {
      await db
        .insert(shiftVolunteerAssignment)
        .values(rowsToInsert)
        .onConflictDoNothing({
          target: [
            shiftVolunteerAssignment.shiftId,
            shiftVolunteerAssignment.volunteerUserId,
          ],
        });
    }
  }

  if (removedVolunteers.length > 0) {
    // Preserve base slots only when the volunteer already checked in early or
    // removing the base slot would drop net below 0 (outgoing resolved > incoming resolved).
    const deletedRows = await db
      .delete(shiftVolunteerAssignment)
      .where(
        and(
          inArray(shiftVolunteerAssignment.shiftId, futureShiftIds),
          inArray(shiftVolunteerAssignment.volunteerUserId, removedVolunteers),
          sql`NOT EXISTS (
            SELECT 1 FROM ${shiftAttendance}
            WHERE ${shiftAttendance.shiftId} = ${shiftVolunteerAssignment.shiftId}
              AND ${shiftAttendance.userId} = ${shiftVolunteerAssignment.volunteerUserId}
          )`,
          sql`${resolvedCoverageBalanceSql(
            shiftVolunteerAssignment.shiftId,
            shiftVolunteerAssignment.volunteerUserId,
          )} >= 0`,
        ),
      )
      .returning({
        shiftId: shiftVolunteerAssignment.shiftId,
        volunteerUserId: shiftVolunteerAssignment.volunteerUserId,
      });

    if (deletedRows.length > 0) {
      const affectedShiftIds = [...new Set(deletedRows.map((r) => r.shiftId))];
      const deletedVolunteerIds = [
        ...new Set(deletedRows.map((r) => r.volunteerUserId)),
      ];

      await db
        .update(coverageRequest)
        .set({ status: CoverageStatus.withdrawn })
        .where(
          and(
            inArray(coverageRequest.shiftId, affectedShiftIds),
            inArray(
              coverageRequest.requestingVolunteerUserId,
              deletedVolunteerIds,
            ),
            eq(coverageRequest.status, CoverageStatus.open),
            not(
              isVolunteerEffectivelyAssignedToShiftSql(
                coverageRequest.shiftId,
                coverageRequest.requestingVolunteerUserId,
              ),
            ),
          ),
        );
    }
  }

  if (addedInstructors.length > 0) {
    const instructorRows = futureShiftIds.flatMap((shiftId) =>
      addedInstructors.map((instructorUserId) => ({
        shiftId,
        instructorUserId,
      })),
    );
    await db
      .insert(shiftInstructorAssignment)
      .values(instructorRows)
      .onConflictDoNothing({
        target: [
          shiftInstructorAssignment.shiftId,
          shiftInstructorAssignment.instructorUserId,
        ],
      });
  }

  if (removedInstructors.length > 0) {
    await db
      .delete(shiftInstructorAssignment)
      .where(
        and(
          inArray(shiftInstructorAssignment.shiftId, futureShiftIds),
          inArray(
            shiftInstructorAssignment.instructorUserId,
            removedInstructors,
          ),
        ),
      );
  }
}
