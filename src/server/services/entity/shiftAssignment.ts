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
  and,
  eq,
  gt,
  inArray,
  isNotNull,
  lt,
  notInArray,
  sql,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";

/**
 * Shared per-shift effective assignment contract.
 *
 * Design:
 * - Each shift snapshots its base volunteer and instructor assignments in
 *   `shift_volunteer_assignment` and `shift_instructor_assignment` when created.
 * - Schedule edits update `volunteer_to_schedule` / `instructor_to_schedule` and
 *   sync only future, non-canceled shifts (`shift.start_at > now AND NOT canceled`),
 *   leaving historical, in-progress, and canceled shift rosters untouched.
 * - Effective volunteer membership on a shift combines its base snapshot with
 *   resolved `coverage_request` transfers using net slot count:
 *     net(shift, volunteer) =
 *       base(shift, volunteer)
 *       + count(resolved coverage where covered_by_volunteer_user_id = volunteer)
 *       - count(resolved coverage where requesting_volunteer_user_id = volunteer
 *               and covered_by_volunteer_user_id IS NOT NULL)
 *   A volunteer is effectively assigned to a shift iff `net(shift, volunteer) > 0`.
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
  /** Requester whose slot this volunteer is covering, when assigned via coverage. */
  coveringForVolunteerUserId: string | null;
  /** Resolved coverage request that assigned this volunteer, if any. */
  coverageRequestId: string | null;
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
 * Pure effective-roster resolver for a single shift.
 * Uses net slot count (`base + incomingResolved - outgoingResolved > 0`) so
 * substitutions, chained handoffs (A -> B -> C), and round-trips (A -> B -> A)
 * resolve deterministically regardless of query row order.
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
          latestIncoming?.requestingVolunteerUserId ?? null,
        coverageRequestId: latestIncoming?.id ?? null,
      });
    }
  }

  return effective;
}

/**
 * SQL predicate equivalent to `resolveEffectiveShiftVolunteers` (`net > 0`).
 * Use in query `WHERE` clauses so visibility and eligibility filters match
 * effective shift hydration exactly.
 */
export function isVolunteerEffectivelyAssignedToShiftSql(
  shiftIdColumn: SQLWrapper,
  volunteerUserId: string,
): SQL<boolean> {
  return sql<boolean>`(
    (CASE WHEN EXISTS (
      SELECT 1 FROM ${shiftVolunteerAssignment}
      WHERE ${shiftVolunteerAssignment.shiftId} = ${shiftIdColumn}
        AND ${shiftVolunteerAssignment.volunteerUserId} = ${volunteerUserId}
    ) THEN 1 ELSE 0 END)
    + (
      SELECT COUNT(*)::int FROM ${coverageRequest} AS cr_in
      WHERE cr_in.shift_id = ${shiftIdColumn}
        AND cr_in.covered_by_volunteer_user_id = ${volunteerUserId}
        AND cr_in.status = ${CoverageStatus.resolved}
    )
    - (
      SELECT COUNT(*)::int FROM ${coverageRequest} AS cr_out
      WHERE cr_out.shift_id = ${shiftIdColumn}
        AND cr_out.requesting_volunteer_user_id = ${volunteerUserId}
        AND cr_out.status = ${CoverageStatus.resolved}
        AND cr_out.covered_by_volunteer_user_id IS NOT NULL
    )
  ) > 0`;
}

/**
 * SQL predicate for whether an instructor is assigned to a specific shift.
 */
export function isInstructorAssignedToShiftSql(
  shiftIdColumn: SQLWrapper,
  instructorUserId: string,
): SQL<boolean> {
  return sql<boolean>`EXISTS (
    SELECT 1 FROM ${shiftInstructorAssignment}
    WHERE ${shiftInstructorAssignment.shiftId} = ${shiftIdColumn}
      AND ${shiftInstructorAssignment.instructorUserId} = ${instructorUserId}
  )`;
}

/**
 * Load effective volunteer assignments for one or more shifts.
 */
export async function getEffectiveVolunteerAssignmentsForShifts(
  db: ShiftAssignmentDb,
  shiftIds: string[],
): Promise<Map<string, EffectiveShiftVolunteerAssignment[]>> {
  const result = new Map<string, EffectiveShiftVolunteerAssignment[]>();
  const uniqueShiftIds = [...new Set(shiftIds)];
  if (uniqueShiftIds.length === 0) {
    return result;
  }

  const [baseRows, resolvedCoverageRows] = await Promise.all([
    db
      .select({
        shiftId: shiftVolunteerAssignment.shiftId,
        volunteerUserId: shiftVolunteerAssignment.volunteerUserId,
      })
      .from(shiftVolunteerAssignment)
      .where(inArray(shiftVolunteerAssignment.shiftId, uniqueShiftIds)),
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

  const baseByShift = new Map<string, string[]>();
  for (const row of baseRows) {
    const list = baseByShift.get(row.shiftId) ?? [];
    list.push(row.volunteerUserId);
    baseByShift.set(row.shiftId, list);
  }

  const resolvedByShift = new Map<string, ResolvedCoverageEdge[]>();
  for (const row of resolvedCoverageRows) {
    if (!row.coveredByVolunteerUserId) continue;
    const list = resolvedByShift.get(row.shiftId) ?? [];
    list.push({
      id: row.id,
      shiftId: row.shiftId,
      requestedAt: row.requestedAt,
      requestingVolunteerUserId: row.requestingVolunteerUserId,
      coveredByVolunteerUserId: row.coveredByVolunteerUserId,
    });
    resolvedByShift.set(row.shiftId, list);
  }

  for (const shiftId of uniqueShiftIds) {
    const baseIds = (baseByShift.get(shiftId) ?? []).sort();
    const resolved = resolvedByShift.get(shiftId) ?? [];
    result.set(
      shiftId,
      resolveEffectiveShiftVolunteers(shiftId, baseIds, resolved),
    );
  }

  return result;
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
  if (uniqueShiftIds.length === 0) {
    return result;
  }

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
 * Check whether a volunteer is effectively assigned to a shift.
 */
export async function isVolunteerEffectivelyAssignedToShift(
  db: ShiftAssignmentDb,
  shiftId: string,
  volunteerUserId: string,
): Promise<boolean> {
  const effectiveByShift = await getEffectiveVolunteerAssignmentsForShifts(db, [
    shiftId,
  ]);
  const effective = effectiveByShift.get(shiftId) ?? [];
  return effective.some((a) => a.volunteerUserId === volunteerUserId);
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
  const effectiveByShift = await getEffectiveVolunteerAssignmentsForShifts(db, [
    shiftId,
  ]);
  const assignments = effectiveByShift.get(shiftId) ?? [];
  if (assignments.length === 0) {
    return [];
  }

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

  const enriched: EffectiveShiftVolunteerUser[] = [];
  for (const assignment of assignments) {
    const u = usersById.get(assignment.volunteerUserId);
    if (!u) continue;
    enriched.push({
      ...assignment,
      name: u.name,
      lastName: u.lastName,
      email: u.email,
      status: u.status,
    });
  }

  return enriched;
}

/**
 * Resolve active shift notification recipients (effective volunteers + assigned
 * instructors) for a shift, deduplicated by user ID.
 */
export async function getEffectiveShiftNotificationRecipients(
  db: ShiftAssignmentDb,
  shiftId: string,
): Promise<ShiftParticipantRecipient[]> {
  const [shiftRow] = await db
    .select({ id: shift.id })
    .from(shift)
    .where(eq(shift.id, shiftId))
    .limit(1);

  if (!shiftRow) {
    return [];
  }

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

  if (participantUserIds.length === 0) {
    return [];
  }

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
 *
 * Accounts for both released assignments (no longer conflicting) and covering
 * assignments (now conflicting).
 */
export async function getConflictingEffectiveVolunteerIds(
  db: ShiftAssignmentDb,
  params: {
    volunteerUserIds: string[];
    startAt: Date;
    endAt: Date;
    excludeShiftIds?: string[];
  },
): Promise<Set<string>> {
  const { volunteerUserIds, startAt, endAt, excludeShiftIds } = params;
  const candidateSet = new Set(volunteerUserIds);
  if (candidateSet.size === 0) {
    return new Set();
  }

  const overlappingConditions = [
    lt(shift.startAt, endAt),
    gt(shift.endAt, startAt),
    eq(shift.canceled, false),
  ];

  if (excludeShiftIds && excludeShiftIds.length > 0) {
    overlappingConditions.push(notInArray(shift.id, excludeShiftIds));
  }

  const overlappingShifts = await db
    .select({ id: shift.id })
    .from(shift)
    .where(and(...overlappingConditions));

  if (overlappingShifts.length === 0) {
    return new Set();
  }

  const effectiveByShift = await getEffectiveVolunteerAssignmentsForShifts(
    db,
    overlappingShifts.map((s) => s.id),
  );

  const conflicting = new Set<string>();
  for (const assignments of effectiveByShift.values()) {
    for (const assignment of assignments) {
      if (candidateSet.has(assignment.volunteerUserId)) {
        conflicting.add(assignment.volunteerUserId);
      }
    }
  }

  return conflicting;
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
  const [scheduleVolunteers, scheduleInstructors] = await Promise.all([
    db
      .select({ volunteerUserId: volunteerToSchedule.volunteerUserId })
      .from(volunteerToSchedule)
      .where(eq(volunteerToSchedule.scheduleId, scheduleId)),
    db
      .select({ instructorUserId: instructorToSchedule.instructorUserId })
      .from(instructorToSchedule)
      .where(eq(instructorToSchedule.scheduleId, scheduleId)),
  ]);

  if (scheduleVolunteers.length > 0) {
    await db
      .insert(shiftVolunteerAssignment)
      .values(
        scheduleVolunteers.map((v) => ({
          shiftId,
          volunteerUserId: v.volunteerUserId,
        })),
      )
      .onConflictDoNothing({
        target: [
          shiftVolunteerAssignment.shiftId,
          shiftVolunteerAssignment.volunteerUserId,
        ],
      });
  }

  if (scheduleInstructors.length > 0) {
    await db
      .insert(shiftInstructorAssignment)
      .values(
        scheduleInstructors.map((i) => ({
          shiftId,
          instructorUserId: i.instructorUserId,
        })),
      )
      .onConflictDoNothing({
        target: [
          shiftInstructorAssignment.shiftId,
          shiftInstructorAssignment.instructorUserId,
        ],
      });
  }
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
    );

  const futureShiftIds = futureShifts.map((s) => s.id);
  if (futureShiftIds.length === 0) {
    return;
  }

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
        // Avoid double-slotting a volunteer who is already effectively assigned
        // to this future shift (e.g., via an existing resolved coverage).
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
    // Preserve base slots where the volunteer already checked in early or has
    // already transferred their slot to a covering volunteer via resolved coverage.
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
          sql`NOT EXISTS (
            SELECT 1 FROM ${coverageRequest}
            WHERE ${coverageRequest.shiftId} = ${shiftVolunteerAssignment.shiftId}
              AND ${coverageRequest.requestingVolunteerUserId} = ${shiftVolunteerAssignment.volunteerUserId}
              AND ${coverageRequest.status} = ${CoverageStatus.resolved}
              AND ${coverageRequest.coveredByVolunteerUserId} IS NOT NULL
          )`,
        ),
      )
      .returning({
        shiftId: shiftVolunteerAssignment.shiftId,
        volunteerUserId: shiftVolunteerAssignment.volunteerUserId,
      });

    // Withdraw any open coverage requests belonging to volunteers who were
    // actually removed from those future shifts.
    if (deletedRows.length > 0) {
      const affectedShiftIds = [...new Set(deletedRows.map((r) => r.shiftId))];
      const effectiveAfterDelete =
        await getEffectiveVolunteerAssignmentsForShifts(db, affectedShiftIds);

      for (const row of deletedRows) {
        const stillAssigned = (
          effectiveAfterDelete.get(row.shiftId) ?? []
        ).some((a) => a.volunteerUserId === row.volunteerUserId);
        if (!stillAssigned) {
          await db
            .update(coverageRequest)
            .set({ status: CoverageStatus.withdrawn })
            .where(
              and(
                eq(coverageRequest.shiftId, row.shiftId),
                eq(
                  coverageRequest.requestingVolunteerUserId,
                  row.volunteerUserId,
                ),
                eq(coverageRequest.status, CoverageStatus.open),
              ),
            );
        }
      }
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
