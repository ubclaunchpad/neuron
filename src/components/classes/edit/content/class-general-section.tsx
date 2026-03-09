"use client";

import { useEffect } from "react";
import { useWatch } from "react-hook-form";

import { CLASS_CATEGORIES } from "@/components/classes/constants";
import { FormFieldController } from "@/components/form/FormField";
import { FormInputField } from "@/components/form/FormInput";
import { FormError, FormFieldLayout } from "@/components/form/FormLayout";
import { FormSelectField } from "@/components/form/FormSelect";
import { FormTextareaField } from "@/components/form/FormTextarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import { LabelRequiredMarker } from "@/components/ui/label";
import {
  Select,
  SelectContent, SelectItem, SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useClassForm } from "../class-form-provider";
import { LOCATION_TYPE } from "../schema";
import { ClassImageInput } from "./class-image-input";

export function ClassGeneralSection() {
  const {
    form: { control, setValue, getValues },
  } = useClassForm();

  const category = useWatch({ control, name: "category" });
  const isExercise = category?.includes("Exercise") ?? false;

  useEffect(() => {
    if (isExercise && !getValues("levelRange")) {
      setValue("levelRange", [1, 4], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [isExercise, setValue, getValues]);

  const locationType = useWatch({ control, name: "locationType" });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Class Info</CardTitle>
        <CardDescription>Basic details about the class.</CardDescription>
      </CardHeader>

      <CardContent>
        <FieldGroup>
          <FormInputField
            control={control}
            name="name"
            label="Title"
            placeholder="e.g. Art from the Heart"
            required
          />

          <FieldGroup className="sm:flex-row">
            <FormSelectField
              control={control}
              name="category"
              label="Category"
              placeholder="Select Category"
              required
            >
              {CLASS_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </FormSelectField>

            <FormInputField
              control={control}
              name="subcategory"
              label="Subcategory"
              placeholder="Enter Subcategory"
            />
          </FieldGroup>

          {isExercise && (
            <FormFieldController control={control} name="levelRange">
              {({ onChange, value, ...field }) => (
                <>
                  <FieldLabel className="w-full flex justify-between items-end">
                    <span>
                      Levels <LabelRequiredMarker />
                    </span>
                    <span className="text-sm">
                      Level {value?.[0] ?? 1}{" "}
                      {value?.[0] !== value?.[1] && `- ${value?.[1] ?? 4}`}
                    </span>
                  </FieldLabel>

                  <div>
                    <Slider
                      min={1}
                      max={4}
                      step={1}
                      value={value ?? [1, 4]}
                      onValueChange={onChange}
                      className="my-2"
                      {...field}
                    />

                    {/* Labels for each level */}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Level 1</span>
                      <span>Level 2</span>
                      <span>Level 3</span>
                      <span>Level 4</span>
                    </div>
                  </div>

                  <FormError />
                </>
              )}
            </FormFieldController>
          )}

          <FormTextareaField
            control={control}
            name="description"
            label="Description"
            placeholder="Enter Description"
            description="Provide a brief overview for users"
          />

          <FieldGroup>
            <FormFieldController control={control} name="locationType">
              {({ value, onChange, ...field }) => (
                <FormFieldLayout
                  label="Location type"
                  description="How the class is held"
                  required
                >
                  <Select
                    value={value}
                    onValueChange={(newValue) => {
                      onChange(newValue);
                      if (newValue === LOCATION_TYPE.MEETING_LINK) {
                        setValue("location", "");
                      } else {
                        setValue("meetingURL", "");
                      }
                    }}
                    {...field}
                  >
                    <SelectTrigger
                      aria-invalid={field["aria-invalid"]}
                      id={field.id}
                      onBlur={field.onBlur}
                      className="shadow-xs"
                    >
                      <SelectValue placeholder="Select how the class is held" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LOCATION_TYPE.MEETING_LINK}>
                        Meeting link
                      </SelectItem>
                      <SelectItem value={LOCATION_TYPE.IN_PERSON}>
                        In-person location
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormError />
                </FormFieldLayout>
              )}
            </FormFieldController>

            {locationType === LOCATION_TYPE.MEETING_LINK && (
              <FormInputField
                control={control}
                name="meetingURL"
                label="Meeting Link"
                placeholder="https://zoom.us/j/..."
                description="Video conferencing link for online classes"
                required
              />
            )}

            {locationType === LOCATION_TYPE.IN_PERSON && (
              <FormInputField
                control={control}
                name="location"
                label="In-person location"
                placeholder="e.g. Building 1, Room 101"
                description="Location for in-person classes"
                required
              />
            )}
          </FieldGroup>

          <ClassImageInput />
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
