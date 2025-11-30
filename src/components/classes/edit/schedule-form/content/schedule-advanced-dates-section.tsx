import { FormDateInputField } from "@/components/form/FormDatePicker";
import { FieldContent, FieldDescription } from "@/components/ui/field";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ScheduleFormControl } from "../schema";

export function ScheduleAdvancedDatesSection({
  control,
}: {
  control: ScheduleFormControl;
}) {
  return (
    <Accordion type="single" collapsible className="w-full border-t mt-4">
      <AccordionItem value="effective-dates" className="px-2">
        <AccordionTrigger className="hover:no-underline">
          Override Term Dates
        </AccordionTrigger>
        <AccordionContent>
          <FieldContent>
            <FieldDescription>
              These dates override the term dates. Use them to specify a custom
              start and end date for this specific schedule, independent of the
              overall term dates.
            </FieldDescription>
            <div className="grid gap-6 md:grid-cols-2">
              <FormDateInputField
                control={control}
                clearable
                name="effectiveStart"
                label="Override Start Date"
              />
              <FormDateInputField
                control={control}
                clearable
                name="effectiveEnd"
                label="Override End Date"
              />
            </div>
          </FieldContent>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
