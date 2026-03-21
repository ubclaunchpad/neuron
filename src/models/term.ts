import type { BlackoutDB, TermDB } from "@/server/db/schema";

export type Holiday = {
  id: string;
  startsOn: string;
  endsOn: string;
};

export type Term = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  published: boolean;
  holidays: Holiday[];
};

export function buildTerm(termDB: TermDB & { blackouts?: BlackoutDB[] }): Term {
  return {
    id: termDB.id,
    name: termDB.name,
    startDate: termDB.startDate,
    endDate: termDB.endDate,
    published: termDB.published,
    holidays:
      termDB.blackouts?.map((b) => ({
        id: b.id,
        startsOn: b.startsOn,
        endsOn: b.endsOn,
      })) ?? [],
  } as const;
}
