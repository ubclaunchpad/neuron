"use client";

import { useVolunteerProfileForm } from "./volunteer-form-provider";

import { FormInputField } from "@/components/form/FormInput";
import { FormTextareaField } from "@/components/form/FormTextarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/primitives/button";

export function VolunteerProfileSection({ isPending }: { isPending: boolean }) {
  const {
    form: { control },
  } = useVolunteerProfileForm();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volunteer Information</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4">
        <FormInputField
          name="preferredName"
          control={control}
          label="Preferred Name"
        />

        <FormInputField name="pronouns" control={control} label="Pronouns" />

        <div className="grid grid-cols-2 gap-4">
          <FormInputField name="city" control={control} label="City" />
          <FormInputField name="province" control={control} label="Province" />
        </div>

        <FormTextareaField name="bio" control={control} label="Bio" />

        <div className="flex justify-end">
          <Button type="submit" pending={isPending}>
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
