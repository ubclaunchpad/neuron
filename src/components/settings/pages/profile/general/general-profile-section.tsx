"use client";

import { useGeneralProfileForm } from "./general-form-provider";
import { ProfileImageInput } from "./profile-image-input";

import { FieldLabel } from "@/components/ui/field";
import { FormInputField } from "@/components/form/FormInput";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/primitives/button";

export function GeneralProfileSection({
  fallbackName,
  isPending,
}: {
  fallbackName: string;
  isPending: boolean;
}) {
  const {
    form: { control, watch, setValue },
  } = useGeneralProfileForm();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="flex flex-col gap-2">
          <FieldLabel>Profile Picture</FieldLabel>
          <ProfileImageInput
            watch={watch}
            setValue={setValue}
            fallbackName={fallbackName}
          />
        </div>

        <div className="flex gap-8">
          <FormInputField
            name="firstName"
            control={control}
            label="First Name"
            required
          />
          <FormInputField
            name="lastName"
            control={control}
            label="Last Name"
            required
          />
        </div>

        <FormInputField
          name="email"
          control={control}
          label="Email"
          type="email"
          disabled
        />

        <div className="flex justify-end">
          <Button type="submit" pending={isPending}>
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
