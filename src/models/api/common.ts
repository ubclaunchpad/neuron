import { z } from "zod";

export const IntId = z.number().int().nonnegative();
export const IntId1Plus = z.number().int().positive();

export const ListRequest = z.object({
  page: z.number().int().positive().optional(),
  perPage: z.number().int().positive().optional(),
});
export type ListRequest = z.infer<typeof ListRequest>;

export const ListRequestWithSearch = ListRequest.extend({
  search: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
export type ListRequestWithSearch = z.infer<typeof ListRequestWithSearch>;
