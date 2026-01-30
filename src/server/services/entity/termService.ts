import {
  UpdateTermInput,
  type CreateTermInput,
  type Holiday,
  type UpdatedHoliday,
} from "@/models/api/term";
import { buildTerm, type Term } from "@/models/term";
import { type Drizzle, type Transaction } from "@/server/db";
import { blackout, term } from "@/server/db/schema/course";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
// import { P } from "node_modules/better-auth/dist/shared/better-auth.jwa4Tx7v";
// import { text } from "stream/consumers";

export interface ITermService {
  getCurrentTerm(nowDate?: string): Promise<Term | undefined>;
  getAllTerms(): Promise<Term[]>;
  getTerms(ids: string[]): Promise<Term[]>;
  getTerm(id: string): Promise<Term>;
  createTerm(input: CreateTermInput): Promise<string>;
  updateTerm(input: UpdateTermInput): Promise<string>;
  deleteTerm(id: string): Promise<void>;
}

export class TermService implements ITermService {
  private readonly db: Drizzle;
  constructor(db: Drizzle) {
    this.db = db;
  }

  async getCurrentTerm(
    nowDate: string = new Date().toISOString(),
  ): Promise<Term | undefined> {
    // Active term if one contains today
    const active = await this.db.query.term.findFirst({
      where: and(lte(term.startDate, nowDate), gte(term.endDate, nowDate)),
      with: { blackouts: true },
      orderBy: [desc(term.startDate)],
    });
    if (active) return buildTerm(active);

    // Most recent past term
    const past = await this.db.query.term.findFirst({
      where: lte(term.endDate, nowDate),
      orderBy: [desc(term.endDate)],
    });
    if (past) return buildTerm(past);

    const future = await this.db.query.term.findFirst({
      with: { blackouts: true },
      orderBy: [term.startDate],
    });

    // Finally, the nearest future term
    return future ? buildTerm(future) : undefined;
  }

  async getAllTerms(): Promise<Term[]> {
    const term = await this.db.query.term.findMany({
      with: { blackouts: true },
    });
    return term.map((d) => buildTerm(d));
  }

  async getTerms(ids: string[]): Promise<Term[]> {
    const data = await this.db.select().from(term).where(inArray(term.id, ids));

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
      where: eq(term.id, id),
      with: { blackouts: true },
    });

    if (!termData)
      throw new NeuronError(
        "Could not find Term with id ${id}",
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
        this.insertHolidays(tx, termId, holidays);
      }

      return termId;
    });
  }

  async updateTerm(input: UpdateTermInput): Promise<string> {
    const { addedHolidays, updatedHolidays, deletedHolidays, id, ...termData } =
      input;

    return await this.db.transaction(async (tx) => {
      const [updatedTerm] = await tx
        .update(term)
        .set(termData)
        .where(eq(term.id, id))
        .returning();

      if (!updatedTerm)
        throw new NeuronError(
          "Failed to update term",
          NeuronErrorCodes.INTERNAL_SERVER_ERROR,
        );

      if (addedHolidays.length > 0) {
        await this.insertHolidays(tx, id, addedHolidays);
      }

      if (updatedHolidays.length > 0) {
        await this.updateHolidays(tx, updatedHolidays);
      }

      if (deletedHolidays.length > 0) {
        const affected = await tx
          .delete(blackout)
          .where(inArray(blackout.id, deletedHolidays))
          .returning();

        if (affected.length != deletedHolidays.length)
          throw new NeuronError(
            "Failed to update term",
            NeuronErrorCodes.INTERNAL_SERVER_ERROR,
          );
      }

      return id;
    });
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

  private async updateHolidays(tx: Transaction, holidays: UpdatedHoliday[]) {
    for (const { id, ...holidayData } of holidays) {
      const updated = await tx
        .update(blackout)
        .set(holidayData)
        .where(eq(blackout.id, id))
        .returning();

      if (updated.length === 0)
        throw new NeuronError(
          `Failed to update term`,
          NeuronErrorCodes.INTERNAL_SERVER_ERROR,
        );
    }
  }
}
