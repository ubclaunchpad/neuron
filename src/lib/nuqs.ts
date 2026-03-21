import { createParser } from "nuqs";
import type * as z from "zod";

export function parseAsUrlEncodedJson<
  TSchema extends z.ZodObject<z.ZodRawShape>,
>(schema: TSchema) {
  return createParser({
    parse: (query) => {
      try {
        const decoded = decodeURIComponent(query);
        const value = JSON.parse(decoded);
        const parsed = schema.safeParse(value);
        return parsed.success ? parsed.data : null;
      } catch {
        return null;
      }
    },
    serialize: (value) => encodeURIComponent(JSON.stringify(value)),
    eq: (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b),
  });
}
