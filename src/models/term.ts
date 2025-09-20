import type { TermDB } from "@/server/db/schema";

export type Term = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

export function buildTerm(
  termDB: TermDB,
): Term {
  return {
    id: termDB.id,
    name: termDB.name,
    startDate: termDB.startDate,
    endDate: termDB.endDate,
  } as const;
}
