"use client";

import { ChevronDown, MapPin, Video } from "lucide-react";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { LabelRequiredMarker } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../../../ui/dropdown-menu";
import { InputGroupButton } from "../../../ui/input-group";
import { useClassForm } from "../class-form-provider";
import { LocationType } from "@/models/api/class";
import { ClassImageInput } from "./class-image-input";

export function ClassGeneralSection() {
  const {
    form: { control, setValue, getValues, trigger, formState },
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

          <FormFieldController control={control} name="location">
            {({ value, onChange, ...field }) => (
              <FormFieldLayout
                label="Location"
                description="Add a video conferencing link or a physical location"
                required
              >
                <InputGroup>
                  <InputGroupAddon
                    align="inline-start"
                    className="pl-[0.65rem]!"
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <InputGroupButton
                          variant="ghost"
                          size="sm"
                          className="rounded ring-0!"
                        >
                          {locationType === LocationType.InPerson ? (
                            <>
                              <MapPin />
                              In-person
                            </>
                          ) : (
                            <>
                              <Video />
                              Online
                            </>
                          )}
                          <ChevronDown className="size-3" />
                        </InputGroupButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-auto">
                        <DropdownMenuRadioGroup
                          value={locationType}
                          onValueChange={(value) => {
                            setValue("locationType", value as LocationType, {
                              shouldDirty: true,
                            });
                            if (formState.isSubmitted) {
                              trigger("location");
                            }
                          }}
                        >
                          <DropdownMenuRadioItem value={LocationType.InPerson}>
                            <MapPin />
                            In-person
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem
                            value={LocationType.MeetingLink}
                          >
                            <Video />
                            Online
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </InputGroupAddon>
                  <InputGroupInput
                    {...field}
                    value={value ?? ""}
                    onChange={onChange}
                    placeholder={
                      locationType === LocationType.MeetingLink
                        ? "https://zoom.us/j/..."
                        : "e.g. Building 1, Room 101"
                    }
                  />
                </InputGroup>
              </FormFieldLayout>
            )}
          </FormFieldController>

          <ClassImageInput />
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
