"use client";

import { Controller } from "react-hook-form";

import { AvailabilityInput } from "@/components/profile/availability-input";
import { FormInputField } from "@/components/form/FormInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/primitives/button";

import { useAvailabilityForm } from "./availability-form-provider";

export function AvailabilitySection({
  isPending,
  hasUnsavedChanges,
  setHasUnsavedChanges,
}: {
  isPending: boolean;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
}) {
  const {
    form: { control },
  } = useAvailabilityForm();

  return (
    <div className="space-y-4">

      <Controller
        name="availability"
        control={control}
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <AvailabilityInput
              availability={field.value}
              hasUnsavedChanges={hasUnsavedChanges}
              onSave={(newAvailability) => {
                field.onChange(newAvailability);
                setHasUnsavedChanges(true);
              }}
            />
            {fieldState.error && (
              <p className="text-sm text-destructive">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      <Card>
        <CardHeader>
          <CardTitle>Preferred Time Commitment</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4">
          <FormInputField
            name="preferredTimeCommitment"
            control={control}
            label="Hours per week"
            type="number"
            min={0}
            max={168}
          />

          <div className="flex justify-end">
            <Button type="submit" pending={isPending}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}