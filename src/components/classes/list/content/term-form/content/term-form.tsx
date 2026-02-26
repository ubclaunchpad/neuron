"use client";

import { FormDateInputField } from "@/components/form/FormDatePicker";
import { FormInputField } from "@/components/form/FormInput";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { getUpcomingSemester } from "@/utils/miscUtils";
import { Temporal } from "@js-temporal/polyfill";
import { useTermForm } from "../term-form-provider";
import { TermDangerZone } from "./term-danger-zone";
import { TermHolidaysSection } from "./term-holidays-section";
import { TermPublishToggle } from "./term-publish-toggle";
import type { Term } from "@/models/term";

export function TermForm({ termData }: { termData?: Term }) {
  const { form, editing, termId } = useTermForm();

  return (
    <>
      {editing && termId !== undefined && termData?.published !== undefined && (
        <TermPublishToggle termId={termId} termName={termData.name} published={termData.published} />
      )}

      <FieldGroup>
        <FormInputField
          control={form.control}
          name="name"
          label="Term Name"
          placeholder={`${getUpcomingSemester()} ${Temporal.Now.plainDateISO().year}`}
          required
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3">
          <FormDateInputField
            control={form.control}
            name="startDate"
            label="Start Date"
            required
          />

          <FormDateInputField
            control={form.control}
            name="endDate"
            label="End Date"
            required
          />
        </div>
      </FieldGroup>

      <FieldSeparator />

      <TermHolidaysSection />

      {editing && termId !== undefined && termData !== undefined && (
        <>
          <FieldSeparator />
          <TermDangerZone termId={termId} termData={termData} />
        </>
      )}
    </>
  );
}
