import type { BlackoutDB, TermDB } from "@/server/db/schema";

export type Term = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  holidays: {
    startsOn: string;
    endsOn: string;
  }[];
};

export function buildTerm(
  termDB: TermDB & { blackouts?: BlackoutDB[] },
): Term {
  return {
    id: termDB.id,
    name: termDB.name,
    startDate: termDB.startDate,
    endDate: termDB.endDate,
    holidays: termDB.blackouts?.map((b) => ({
      startsOn: b.startsOn,
      endsOn: b.endsOn,
    })) ?? [],
  } as const;
}
