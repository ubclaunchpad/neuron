import { z } from "zod";

/** Strict-ish YYYY-MM-DD (no timezone). */
export const DateYMD = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: "Expected date in YYYY-MM-DD",
  });

/** 24h time HH:mm or HH:mm:ss */
export const Time24 = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, {
    message: "Expected 24h time (HH:mm or HH:mm:ss)",
  });


export const IntId = z.number().int().nonnegative();
export const IntId1Plus = z.number().int().positive();
export const Uuid = z.string().uuid();

export const BasePagination = z.object({
  page: z.number().int().positive().optional(),
  perPage: z.number().int().positive().optional(),
});