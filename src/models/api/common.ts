import { z } from "zod";

export const IntId = z.number().int().nonnegative();
export const IntId1Plus = z.number().int().positive();

export const ListRequest = z.object({
  perPage: z.number().int().positive().max(100).default(20),
  cursor: z.number().nullish(),
});
export type ListRequest = z.infer<typeof ListRequest>;


export const ListRequestWithSearch = ListRequest.extend({
  search: z.string().optional(),
});
export type ListRequestWithSearch = z.infer<typeof ListRequestWithSearch>;
