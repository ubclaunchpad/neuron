"use client";

import { CLASS_CATEGORIES } from "@/components/classes/constants";
import { FormInputField } from "@/components/form/FormInput";
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
import { SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useClassForm } from "../class-form-provider";
import { ClassImageInput } from "./class-image-input";
import { FormFieldController } from "@/components/form/FormField";
import { FormError } from "@/components/form/FormLayout";

export function ClassGeneralSection() {
  const {
    form: { control },
  } = useClassForm();

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

          <FormFieldController control={control} name="levelRange">
            {({ onChange, value, ...field }) => (
              <>
                <FieldLabel className="w-full flex justify-between items-end">
                  <span>
                    Levels <LabelRequiredMarker />
                  </span>
                  <span className="text-sm">
                    Level {value[0]} {value[0] !== value[1] && `- ${value[1]}`}
                  </span>
                </FieldLabel>

                <div>
                  <Slider
                    min={1}
                    max={4}
                    step={1}
                    value={value}
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

          <FormTextareaField
            control={control}
            name="description"
            label="Description"
            placeholder="Enter Description"
            description="Provide a brief overview for users"
          />

          <FormInputField
            control={control}
            name="meetingURL"
            label="Meeting Link"
            placeholder="https://zoom.us/j/..."
            description="Add a video conferencing link for online classes"
          />

          <ClassImageInput />
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
