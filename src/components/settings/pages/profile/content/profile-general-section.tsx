"use client";

import { useProfileForm } from "../profile-form-provider";
import { ProfileImageInput } from "./profile-image-input";

import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ProfileGeneralSection({ 
  fallbackName,
  isVolunteer = false,
}: { 
  fallbackName: string,
  isVolunteer?: boolean,
}) {
  const {
    form: { register, watch, setValue, formState: { errors } },
  } = useProfileForm();

  return (
    <>
      <div className="flex flex-col gap-2">
        <FieldLabel>Profile Picture</FieldLabel>
        <ProfileImageInput
          watch={watch}
          setValue={setValue}
          fallbackName={fallbackName}
        />
      </div>

      <div className="flex gap-8">
        <Field data-invalid={!!errors.firstName}>
          <FieldLabel>First Name</FieldLabel>
          <Input {...register("firstName")} />
          <FieldError errors={errors.firstName} />
        </Field>

        <Field data-invalid={!!errors.lastName}>
          <FieldLabel>Last Name</FieldLabel>
          <Input {...register("lastName")} />
          <FieldError errors={errors.lastName} />
        </Field>
      </div>

      <Field data-invalid={!!errors.email}>
        <FieldLabel>Email</FieldLabel>
        <Input 
          type="email" {...register("email")}
          disabled={!isVolunteer} 
        />
        <FieldError errors={errors.email} />
      </Field>

      {isVolunteer && (
        <>
          <Field>
            <FieldLabel>Preferred Name</FieldLabel>
            <Input {...register("preferredName")} />
          </Field>

          <Field>
            <FieldLabel>Pronouns</FieldLabel>
            <Input {...register("pronouns")} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>City</FieldLabel>
              <Input {...register("city")} />
            </Field>

            <Field>
              <FieldLabel>Province</FieldLabel>
              <Input {...register("province")} />
            </Field>
          </div>

          <Field>
            <FieldLabel>Bio</FieldLabel>
            <Textarea {...register("bio")} />
          </Field>
        </>
      )}
    </>
  );
}