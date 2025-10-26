import { sql } from "drizzle-orm";
import { ListRequest } from "@/models/api/common";

export const getPagination = (listRequest: ListRequest) => {
  const page = listRequest.page ?? 0;
  const perPage = listRequest.perPage ?? 10;
  const offset = page * perPage;
  return { page, perPage, offset } as const;
};

export const buildSimilarityExpression = (name: string, lastName: string, email: string, queryInput: string) => {
  return sql<number>`((similarity(${name}, ${queryInput}) * 3) +
      (similarity(${lastName}, ${queryInput}) * 2) +
      (similarity(${email}, ${queryInput}) * 1))`;
};

export const buildSearchCondition = (name: string, lastName: string, email: string, queryInput: string) => {
  return sql`(LOWER(${name}) % LOWER(${queryInput}) OR
          LOWER(${lastName}) % LOWER(${queryInput}) OR
          LOWER(${email}) %> LOWER(${queryInput}))`;
};
