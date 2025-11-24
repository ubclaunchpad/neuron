import type { ListRequest } from "@/models/api/common";
import { sql, type AnyColumn } from "drizzle-orm";

export const getPagination = <T extends ListRequest>(listRequest: T) => {
  const { perPage, cursor, ...rest } = listRequest;
  return {
    perPage: perPage ?? 10,
    offset: cursor ?? 0,
    ...rest,
  } as const;
};

/**
 * Build an ORDER BY expression by summing the similarity of the columns with the query input.
 */
export const buildSimilarityExpression = (
  columns: AnyColumn[],
  queryInput: string,
) => {
  if (columns.length === 0) {
    return sql<number>`0`;
  }

  const term = (column: AnyColumn) =>
    sql<number>`similarity(LOWER(${column}), LOWER(${queryInput}))`;

  let expression = term(columns[0] as AnyColumn);
  columns.forEach((column) => {
    expression = sql<number>`(${expression} + ${term(column)})`;
  });

  return expression;
};

/**
 * Build a WHERE condition by checking if any column has similarity > minThreshold.
 */
export const buildSearchCondition = (
  columns: AnyColumn[],
  queryInput: string,
  minThreshold: number = 0.4,
) => {
  if (columns.length === 0) {
    return sql`false`;
  }

  const term = (column: AnyColumn) =>
    sql`similarity(LOWER(${column}), LOWER(${queryInput})) > ${minThreshold}`;

  let expression = term(columns[0] as AnyColumn);
  columns.forEach((column) => {
    expression = sql`(${expression} OR ${term(column)})`;
  });

  return expression;
};
