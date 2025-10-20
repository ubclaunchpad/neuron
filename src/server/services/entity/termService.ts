import { type CreateTermInput } from "@/models/api/term";
import { buildTerm, type Term } from "@/models/term";
import { type Drizzle } from "@/server/db";
import { blackout, term } from "@/server/db/schema/course";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";

export class TermService {
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
      with: {blackouts: true},
      orderBy: [desc(term.startDate)],
    });
    if (active)
      return buildTerm(active);

    // Most recent past term
    const past = await this.db.query.term.findFirst({
      where: lte(term.endDate, nowDate),
      orderBy: [desc(term.endDate)],
    });
    if (past) 
      return buildTerm(past);

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
      with: {blackouts: true},
    });

    if (!termData) throw new NeuronError(
      'Could not find Term with id ${id}', 
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
        .returning({id: term.id});

      if(!createdTerm) {
        throw new Error("Failed to create term")
      }

      const termId = createdTerm.id; 

      if (holidays.length > 0) {
        await tx.insert(blackout).values(
          holidays.map((h) => ({
            termId,
            startsOn: h.startsOn,
            endsOn: h.endsOn,
          }))
        );
      }
      
      return termId;
    });
  }

  async deleteTerm(id: string): Promise<void> {
    const deleted = await this.db
      .delete(term)
      .where(eq(term.id, id))
      .returning();

    if (deleted.length === 0) {
      throw new NeuronError(
        `Could not find Term with id ${id}`,
        NeuronErrorCodes.NOT_FOUND,
      );
    }
  }
}
