import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { user } from "@/server/db/schema";
import {
  buildSearchCondition,
  buildSimilarityExpression,
} from "@/utils/searchUtils";

const dialect = new PgDialect();

describe("searchUtils", () => {
  it("does not duplicate the first column in buildSimilarityExpression", () => {
    const expr = buildSimilarityExpression(
      [user.name, user.lastName, user.email],
      "alice",
    );
    const { sql } = dialect.sqlToQuery(expr);

    expect(sql.match(/"user"\."name"/g)).toHaveLength(1);
    expect(sql.match(/"user"\."last_name"/g)).toHaveLength(1);
    expect(sql.match(/"user"\."email"/g)).toHaveLength(1);
  });

  it("does not duplicate the first column in buildSearchCondition", () => {
    const cond = buildSearchCondition(
      [user.name, user.lastName, user.email],
      "alice",
    );
    const { sql } = dialect.sqlToQuery(cond);

    expect(sql.match(/"user"\."name"/g)).toHaveLength(1);
    expect(sql.match(/"user"\."last_name"/g)).toHaveLength(1);
    expect(sql.match(/"user"\."email"/g)).toHaveLength(1);
  });

  it("handles a single column without repeating it", () => {
    const expr = buildSimilarityExpression([user.name], "alice");
    const cond = buildSearchCondition([user.name], "alice");

    expect(dialect.sqlToQuery(expr).sql.match(/"user"\."name"/g)).toHaveLength(
      1,
    );
    expect(dialect.sqlToQuery(cond).sql.match(/"user"\."name"/g)).toHaveLength(
      1,
    );
  });
});
