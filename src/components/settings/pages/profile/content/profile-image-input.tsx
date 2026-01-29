"use client";

import { useEffect, useRef } from "react";
import type { UseFormSetValue, UseFormWatch } from "react-hook-form";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneArea,
  DropzoneDescription,
  DropzoneHeader,
  DropzoneHint,
  DropzoneMedia,
} from "@/components/ui/dropzone";
import { cropImageToSquare } from "@/lib/crop-image";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

type Props = {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  fallbackName?: string;
};

export function ProfileImageInput({
  watch,
  setValue,
  fallbackName = "U",
}: Props) {
  const imageValue = watch("image") as string | undefined;
  const previousImageRef = useRef<string | null>(imageValue ?? null);

  // Clean up old blob URLs
  useEffect(() => {
    const prev = previousImageRef.current;
    const next = imageValue ?? null;

    if (prev && prev !== next && prev.startsWith("blob:")) {
      URL.revokeObjectURL(prev);
    }

    previousImageRef.current = next;
  }, [imageValue]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      const last = previousImageRef.current;
      if (last?.startsWith("blob:")) {
        URL.revokeObjectURL(last);
      }
    };
  }, []);

  return (
    <Dropzone
      accept="image/*"
      multiple={false}
      maxSize={4 * 1024 * 1024}
      onFilesChange={async (files) => {
        const file = files[0]?.file;

        if (file instanceof File) {
          const { previewUrl } = await cropImageToSquare(file, {
            size: 512,
            mimeType: "image/webp",
            quality: 0.8,
          });

          setValue("image", previewUrl, {
            shouldDirty: true,
            shouldTouch: true,
          });
        } else {
          setValue("image", undefined);
        }
      }}
      onError={(errors) => toast.error(errors[0])}
    >
      <div className="flex gap-4 items-start">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="aspect-square size-[140px] shrink-0 rounded-md pointer-events-none">
            <AvatarImage
              src={imageValue ?? undefined}
              className="rounded-md object-cover"
            />
            <AvatarFallback className="rounded-md text-4xl">
              {fallbackName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setValue("image", undefined, { shouldDirty: true })}
            className="w-full max-w-[140px] text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>

        <DropzoneArea>
          <DropzoneHeader>
            <DropzoneMedia variant="icon">
              <Upload />
            </DropzoneMedia>

            <DropzoneDescription>
              Drag and drop or click to upload
            </DropzoneDescription>

            <DropzoneHint>JPG, PNG, WEBP (max 4MB)</DropzoneHint>
          </DropzoneHeader>
        </DropzoneArea>
      </div>
    </Dropzone>
  );
}
