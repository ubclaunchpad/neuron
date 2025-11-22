import type { ListRequest } from "@/models/api/common";
import { sql, type AnyColumn } from "drizzle-orm";

export const getPagination = (listRequest: ListRequest) => {
  const perPage = listRequest.perPage ?? 10;
  const offset = listRequest.cursor ?? 0;
  return { perPage, offset } as const;
};

// Order columns by most important first to least important
export const buildSimilarityExpression = (columns: AnyColumn[], queryInput: string) => {
  if (columns.length === 0) {
    return sql<number>`0`;
  }

  const total = columns.length;
  let expression = sql<number>`(similarity(${columns[0]}, ${queryInput}) * ${total})`;

  for (let i = 1; i < columns.length; i++) {
    const weight = total - i;
    const part = sql<number>`(similarity(${columns[i]}, ${queryInput}) * ${weight})`;
    expression = sql<number>`(${expression} + ${part})`;
  }

  return expression;
};

export const buildSearchCondition = (columns: AnyColumn[], queryInput: string) => {
  if (columns.length === 0) {
    return sql`false`;
  }

  let expression = sql`(LOWER(${columns[0]}) % LOWER(${queryInput}))`;

  for (let i = 1; i < columns.length; i++) {
    const part = sql`(LOWER(${columns[i]}) % LOWER(${queryInput}))`;
    expression = sql`(${expression} OR ${part})`;
  }

  return expression;
};