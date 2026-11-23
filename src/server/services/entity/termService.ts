import {
  UpdateTermInput,
  type CreateTermInput,
  type Holiday,
  type UpdatedHoliday,
} from "@/models/api/term";
import { hasPermission } from "@/lib/auth/extensions/permissions";
import { buildTerm, type Term } from "@/models/term";
import { type Drizzle, type Transaction } from "@/server/db";
import { blackout, course, term } from "@/server/db/schema/course";
import { shift } from "@/server/db/schema/shift";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import type { ICurrentSessionService } from "@/server/services/currentSessionService";
import { and, asc, desc, eq, gte, inArray, lte, type SQL } from "drizzle-orm";

export interface ITermService {
  getCurrentTerm(nowDate?: string): Promise<Term | undefined>;
  getAllTerms(): Promise<Term[]>;
  getTerms(ids: string[]): Promise<Term[]>;
  getTerm(id: string): Promise<Term>;
  createTerm(input: CreateTermInput): Promise<string>;
  updateTerm(input: UpdateTermInput): Promise<string>;
  deleteTerm(id: string): Promise<void>;
  publishTerm(id: string): Promise<void>;
  unpublishTerm(id: string): Promise<void>;
}

export class TermService implements ITermService {
  private readonly db: Drizzle;
  private readonly currentSessionService: ICurrentSessionService;

  constructor({
    db,
    currentSessionService,
  }: {
    db: Drizzle;
    currentSessionService: ICurrentSessionService;
  }) {
    this.db = db;
    this.currentSessionService = currentSessionService;
  }

  private canSeeUnpublished(): boolean {
    const user = this.currentSessionService.getUser();
    if (!user) return false;
    return hasPermission({
      user,
      permission: { terms: ["view-unpublished"] },
    });
  }

  private publishedFilter(): SQL<unknown> | undefined {
    if (this.canSeeUnpublished()) return undefined;
    return eq(term.published, true);
  }

  async getCurrentTerm(
    nowDate: string = new Date().toISOString(),
  ): Promise<Term | undefined> {
    const publishedCondition = this.publishedFilter();

    // Active term if one contains today
    const active = await this.db.query.term.findFirst({
      where: and(
        lte(term.startDate, nowDate),
        gte(term.endDate, nowDate),
        publishedCondition,
      ),
      with: { blackouts: true },
      orderBy: [desc(term.startDate)],
    });
    if (active) return buildTerm(active);

    // Most recent past term
    const past = await this.db.query.term.findFirst({
      where: and(lte(term.endDate, nowDate), publishedCondition),
      orderBy: [desc(term.endDate)],
    });
    if (past) return buildTerm(past);

    const future = await this.db.query.term.findFirst({
      where: publishedCondition,
      with: { blackouts: true },
      orderBy: [term.startDate],
    });

    // Finally, the nearest future term
    return future ? buildTerm(future) : undefined;
  }

  async getAllTerms(): Promise<Term[]> {
    const terms = await this.db.query.term.findMany({
      where: this.publishedFilter(),
      with: { blackouts: true },
      orderBy: [desc(term.startDate), desc(term.id)],
    });
    return terms.map((d) => buildTerm(d));
  }

  async getTerms(ids: string[]): Promise<Term[]> {
    const data = await this.db
      .select()
      .from(term)
      .where(and(inArray(term.id, ids), this.publishedFilter()));

    if (data.length !== ids.length) {
      const firstMissing = ids.find((id) => !data.some((d) => d.id === id));
      throw new NeuronError(
        `Could not find Term with id ${firstMissing}`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }

    return data.map((d) => buildTerm(d));
  }

  async getTerm(id: string): Promise<Term> {
    const termData = await this.db.query.term.findFirst({
      where: and(eq(term.id, id), this.publishedFilter()),
      with: { blackouts: true },
    });

    if (!termData)
      throw new NeuronError(
        `Could not find Term with id ${id}`,
        NeuronErrorCodes.NOT_FOUND,
      );

    return buildTerm(termData);
  }

  async createTerm(input: CreateTermInput): Promise<string> {
    const { holidays, ...termData } = input;

    return await this.db.transaction(async (tx) => {
      const [createdTerm] = await tx
        .insert(term)
        .values(termData)
        .returning({ id: term.id });

      if (!createdTerm)
        throw new NeuronError(
          "Failed to create term",
          NeuronErrorCodes.INTERNAL_SERVER_ERROR,
        );

      const termId = createdTerm.id;

      if (holidays.length > 0) {
        await this.insertHolidays(tx, termId, holidays);
      }

      return termId;
    });
  }

  /**
   * Updates a term and its holidays atomically.
   *
   * Published-occurrence immutability policy:
   * Mirrors `ClassService.updateClass`: once any class in the term is
   * published (or has generated shifts), changing `startDate`, `endDate`, or
   * adding/updating/deleting term holidays is rejected with `BAD_REQUEST` so
   * generated shifts and pending shift-notification jobs cannot drift out of
   * sync with term bounds or blackouts. Non-occurrence metadata updates (such
   * as renaming the term while leaving dates and holidays unchanged) remain
   * permitted.
   */
  async updateTerm(input: UpdateTermInput): Promise<string> {
    const { addedHolidays, updatedHolidays, deletedHolidays, id, ...termData } =
      input;

    return await this.db.transaction(async (tx) => {
      const [originalTerm] = await tx
        .select()
        .from(term)
        .where(eq(term.id, id))
        .for("update");

      if (!originalTerm) {
        throw new NeuronError(
          `Could not find Term with id ${id}`,
          NeuronErrorCodes.NOT_FOUND,
        );
      }

      const updatedHolidayIds = updatedHolidays.map((h) => h.id);
      const updatedHolidayIdSet = new Set(updatedHolidayIds);
      if (updatedHolidayIdSet.size !== updatedHolidayIds.length) {
        throw new NeuronError(
          "Duplicate holiday IDs in update request.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      const deletedHolidayIdSet = new Set(deletedHolidays);
      if (deletedHolidayIdSet.size !== deletedHolidays.length) {
        throw new NeuronError(
          "Duplicate holiday IDs in delete request.",
          NeuronErrorCodes.BAD_REQUEST,
        );
      }

      for (const holidayId of deletedHolidayIdSet) {
        if (updatedHolidayIdSet.has(holidayId)) {
          throw new NeuronError(
            `Holiday with id ${holidayId} cannot be both updated and deleted.`,
            NeuronErrorCodes.BAD_REQUEST,
          );
        }
      }

      const referencedHolidayIds = [...updatedHolidayIds, ...deletedHolidays];
      if (referencedHolidayIds.length > 0) {
        const ownedHolidays = await tx
          .select({ id: blackout.id })
          .from(blackout)
          .where(
            and(
              eq(blackout.termId, id),
              inArray(blackout.id, referencedHolidayIds),
            ),
          );
        const ownedHolidayIds = new Set(ownedHolidays.map((h) => h.id));
        const invalidHolidayId = referencedHolidayIds.find(
          (holidayId) => !ownedHolidayIds.has(holidayId),
        );
        if (invalidHolidayId) {
          throw new NeuronError(
            `Holiday with id ${invalidHolidayId} does not belong to term ${id}.`,
            NeuronErrorCodes.BAD_REQUEST,
          );
        }
      }

      const isChangingStartDate =
        termData.startDate !== undefined &&
        termData.startDate !== originalTerm.startDate;
      const isChangingEndDate =
        termData.endDate !== undefined &&
        termData.endDate !== originalTerm.endDate;
      const isChangingHolidays =
        addedHolidays.length > 0 ||
        updatedHolidays.length > 0 ||
        deletedHolidays.length > 0;

      if (isChangingStartDate || isChangingEndDate || isChangingHolidays) {
        // Lock courses in this term in deterministic order so concurrent
        // ClassService.publishClass calls serialize cleanly against term edits.
        const termCourses = await tx
          .select({ id: course.id, published: course.published })
          .from(course)
          .where(eq(course.termId, id))
          .orderBy(asc(course.id))
          .for("update");

        const hasPublishedClass = termCourses.some((c) => c.published);
        const hasGeneratedShifts =
          !hasPublishedClass &&
          termCourses.length > 0 &&
          (
            await tx
              .select({ id: shift.id })
              .from(shift)
              .where(
                inArray(
                  shift.courseId,
                  termCourses.map((c) => c.id),
                ),
              )
              .limit(1)
          ).length > 0;

        if (hasPublishedClass || hasGeneratedShifts) {
          throw new NeuronError(
            "Term dates and holidays cannot be changed after classes in the term have been published.",
            NeuronErrorCodes.BAD_REQUEST,
          );
        }
      }

      const [updatedTerm] = await tx
        .update(term)
        .set(termData)
        .where(eq(term.id, id))
        .returning({ id: term.id });

      if (!updatedTerm)
        throw new NeuronError(
          "Failed to update term",
          NeuronErrorCodes.INTERNAL_SERVER_ERROR,
        );

      if (addedHolidays.length > 0) {
        await this.insertHolidays(tx, id, addedHolidays);
      }

      if (updatedHolidays.length > 0) {
        await this.updateHolidays(tx, id, updatedHolidays);
      }

      if (deletedHolidays.length > 0) {
        const affected = await tx
          .delete(blackout)
          .where(
            and(eq(blackout.termId, id), inArray(blackout.id, deletedHolidays)),
          )
          .returning({ id: blackout.id });

        if (affected.length !== deletedHolidays.length)
          throw new NeuronError(
            "Failed to update term",
            NeuronErrorCodes.INTERNAL_SERVER_ERROR,
          );
      }

      return id;
    });
  }

  async publishTerm(id: string): Promise<void> {
    const updated = await this.db
      .update(term)
      .set({ published: true })
      .where(eq(term.id, id))
      .returning({ id: term.id });

    if (updated.length === 0)
      throw new NeuronError(
        `Could not find Term with id ${id}`,
        NeuronErrorCodes.NOT_FOUND,
      );
  }

  async unpublishTerm(id: string): Promise<void> {
    const updated = await this.db
      .update(term)
      .set({ published: false })
      .where(eq(term.id, id))
      .returning({ id: term.id });

    if (updated.length === 0)
      throw new NeuronError(
        `Could not find Term with id ${id}`,
        NeuronErrorCodes.NOT_FOUND,
      );
  }

  async deleteTerm(id: string): Promise<void> {
    const deleted = await this.db
      .delete(term)
      .where(eq(term.id, id))
      .returning();

    if (deleted.length === 0)
      throw new NeuronError(
        `Could not find Term with id ${id}`,
        NeuronErrorCodes.NOT_FOUND,
      );
  }

  private async insertHolidays(
    tx: Transaction,
    termId: string,
    holidays: Holiday[],
  ) {
    await tx.insert(blackout).values(
      holidays.map((h) => ({
        termId,
        startsOn: h.startsOn,
        endsOn: h.endsOn,
      })),
    );
  }

  private async updateHolidays(
    tx: Transaction,
    termId: string,
    holidays: UpdatedHoliday[],
  ) {
    for (const { id, ...holidayData } of holidays) {
      const patch: Partial<typeof blackout.$inferInsert> = {};
      if (holidayData.startsOn !== undefined) {
        patch.startsOn = holidayData.startsOn;
      }
      if (holidayData.endsOn !== undefined) {
        patch.endsOn = holidayData.endsOn;
      }
      if (Object.keys(patch).length === 0) {
        continue;
      }

      const updated = await tx
        .update(blackout)
        .set(patch)
        .where(and(eq(blackout.id, id), eq(blackout.termId, termId)))
        .returning({ id: blackout.id });

      if (updated.length === 0)
        throw new NeuronError(
          `Failed to update term`,
          NeuronErrorCodes.INTERNAL_SERVER_ERROR,
        );
    }
  }
}
