import { Temporal } from "@js-temporal/polyfill";
import { z } from "zod";

export const ZonedDateTime = z.string().transform((s, ctx) => {
    try {
      // be strict about offset matching the zone if an offset is present
      return Temporal.ZonedDateTime.from(s, { offset: "reject" });
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid ZonedDateTime. Must include [IANA time zone], e.g. 2025-09-23T15:00:00[America/Vancouver]",
      });
      return z.NEVER;
    }
});
    