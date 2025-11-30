"use client";

import { useEffect, useRef } from "react";
import { useWatch } from "react-hook-form";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneArea,
  DropzoneDescription,
  DropzoneHeader,
  DropzoneHint,
  DropzoneLabel,
  DropzoneMedia,
} from "@/components/ui/dropzone";
import { Field, FieldContent } from "@/components/ui/field";
import { cropImageToSquare } from "@/lib/crop-image";
import { cn } from "@/lib/utils";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useClassForm } from "../class-form-provider";
import { FormFieldController } from "@/components/form/FormField";
import { FormDescription, FormLabel } from "@/components/form/FormLayout";

export function ClassImageInput() {
  const {
    form: { control },
  } = useClassForm();

  const currentClassName = useWatch({ control, name: "name" });
  const imageValue = useWatch({ control, name: "image" });
  const previousImageRef = useRef<string | null>(imageValue ?? null);

  // Clean up previous blob URL whenever the image changes
  useEffect(() => {
    const prev = previousImageRef.current;
    const next = imageValue ?? null;

    if (prev && prev !== next && prev.startsWith("blob:")) {
      URL.revokeObjectURL(prev);
    }

    previousImageRef.current = next;
  }, [imageValue]);

  // Clean up the last blob URL when the component unmounts
  useEffect(() => {
    return () => {
      const last = previousImageRef.current;
      if (last?.startsWith("blob:")) {
        URL.revokeObjectURL(last);
      }
    };
  }, []);

  return (
    <FormFieldController control={control} name="image">
      {({ onChange, value }) => (
        <Field>
          <FieldContent>
            <FormLabel>Cover Image</FormLabel>
            <FormDescription>
              Choose a cover image to represent this class.
            </FormDescription>
          </FieldContent>

          <Dropzone
            accept="image/*"
            multiple={false}
            maxSize={4 * 1024 * 1024 /* 4MB */}
            onFilesChange={async (files) => {
              const file = files[0]?.file;
              if (file instanceof File) {
                // Crop image
                const { previewUrl } = await cropImageToSquare(file, {
                  size: 512,
                  mimeType: "image/webp",
                  quality: 0.8,
                });

                onChange(previewUrl);
              } else if (!file) {
                onChange(null);
              }
            }}
            onError={(errors) => {
              toast.error(errors[0]);
            }}
          >
            <div
              className={cn(
                "grid gap-4 [grid-template-columns:min-content_1fr]",
                "[grid-template-areas:'img_btn''drp_drp']",
                "sm:[grid-template-areas:'img_drp''btn_drp']",
              )}
            >
              <Avatar className="[grid-area:img] aspect-square size-[140px] shrink-0 rounded-md pointer-events-none [container-type:inline-size]">
                <AvatarImage
                  src={value ?? undefined}
                  alt={currentClassName}
                  className="rounded-md object-cover"
                />
                <AvatarFallback className="rounded-md text-[50cqw]">
                  {currentClassName.slice(0, 2).toUpperCase() || "CL"}
                </AvatarFallback>
              </Avatar>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onChange(null)}
                className="[grid-area:btn] self-center not-sm:w-min text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 />
                <span>Clear Image</span>
              </Button>
              <DropzoneArea
                className={cn(
                  "min-w-[260px] [grid-area:drp]",
                  false ? "opacity-60 pointer-events-none" : "",
                )}
              >
                <DropzoneHeader>
                  <DropzoneMedia variant="icon">
                    <Upload />
                  </DropzoneMedia>

                  <DropzoneDescription>
                    Drag and drop or{" "}
                    <DropzoneLabel>click to upload</DropzoneLabel>
                  </DropzoneDescription>

                  <DropzoneHint>
                    SVG, PNG, JPG, or other supported image formats (max. 4MB)
                  </DropzoneHint>
                </DropzoneHeader>
              </DropzoneArea>
            </div>
          </Dropzone>
        </Field>
      )}
    </FormFieldController>
  );
}
