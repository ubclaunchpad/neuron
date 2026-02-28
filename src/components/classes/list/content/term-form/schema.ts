import type { Term } from "@/models/term";
import { Temporal } from "@js-temporal/polyfill";
import z from "zod";

const TermHolidaySchema = z
  .object({
    id: z.uuid().optional(),
    from: z.iso.date("Please fill out this field."),
    to: z.iso.date("Please fill out this field."),
  })
  .superRefine((value, ctx): void => {
    if (value.from && value.to) {
      const from = Temporal.PlainDate.from(value.from);
      const to = Temporal.PlainDate.from(value.to);
      if (Temporal.PlainDate.compare(from, to) > 0) {
        ctx.addIssue({
          code: "custom",
          path: ["to"],
          message: "End date must be after start date.",
        });
      }
    }
  });
export type TermHolidaySchemaType = z.input<typeof TermHolidaySchema>;

export const TermEditSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().nonempty("Please fill out this field."),
    startDate: z.iso.date("Please fill out this field."),
    endDate: z.iso.date("Please fill out this field."),
    holidays: z.array(TermHolidaySchema).default([]),
  })
  .superRefine((value, ctx): void => {
    if (value.startDate && value.endDate) {
      const from = Temporal.PlainDate.from(value.startDate);
      const to = Temporal.PlainDate.from(value.endDate);
      if (Temporal.PlainDate.compare(from, to) >= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["startDate"],
          message: "End date must be after start date.",
        });
      }
    }
  });
export type TermEditSchemaInput = z.input<typeof TermEditSchema>;
export type TermEditSchemaOutput = z.output<typeof TermEditSchema>;

export function toFormValues(term?: Term): TermEditSchemaInput {
  return {
    id: term?.id,
    name: term?.name ?? "",
    startDate: term?.startDate ?? "",
    endDate: term?.endDate ?? "",
    holidays:
      term?.holidays.map((holiday) => ({
        id: holiday.id,
        from: holiday.startsOn,
        to: holiday.endsOn,
      })) ?? [],
  } as const;
}
