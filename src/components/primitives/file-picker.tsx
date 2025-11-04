"use client";

import { useFileUpload } from "@/hooks/use-file-upload";
import type { ObjectType } from "@/models/interfaces";
import { clientApi } from "@/trpc/client";
import type { ReactNode } from "react";
import { useRef } from "react";
import { toast } from "sonner";

interface FilePickerProps {
  objectType: ObjectType; // "user" | "class"
  id: string; // user id or class id
  disabled?: boolean;
  targetSize?: number; // default 250x250
  onUploaded?: (objectKey: string) => void;
  onPreviewUrl?: (url: string) => void;
  children?: ReactNode; // clickable trigger content
}

export function FilePicker({ 
  objectType, 
  id, 
  disabled = false, 
  targetSize = 250, 
  onUploaded, 
  onPreviewUrl,
  children 
}: FilePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const getPresignedUrlMutation = clientApi.profile.getPresignedUrl.useMutation();
  const uploader = useFileUpload({
    getPresignedUrl: async () => {
      const fileExtension = "webp";
      const { url } = await getPresignedUrlMutation.mutateAsync({ objectType, id, fileExtension });
      const key = `${objectType}/${objectType}_${id}/profile-picture.${fileExtension}`;
      return { url, key, contentType: "image/webp" };
    },
  });

  const createCanvas = (width: number, height: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };

  const createContext = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    return ctx;
  };

  const centerImage = (img: HTMLImageElement) => {
    const sourceWidth = img.width;
    const sourceHeight = img.height;
    const cropSize = Math.min(sourceWidth, sourceHeight);
    const sourceX = (sourceWidth - cropSize) / 2;
    const sourceY = (sourceHeight - cropSize) / 2;
    return { sourceX, sourceY, cropSize };
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error("No file selected");
      return;
    }

    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

    const canvas = createCanvas(targetSize, targetSize);
    const ctx = createContext(canvas);
    if (!ctx) return;

    const { sourceX, sourceY, cropSize } = centerImage(img);
    ctx.drawImage(img, sourceX, sourceY, cropSize, cropSize, 0, 0, targetSize, targetSize);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        onPreviewUrl?.(URL.createObjectURL(blob));

        try {
          const key = await uploader.upload({ file, data: blob, contentType: "image/webp" });
          onUploaded?.(key);
          toast.success("Image uploaded successfully");
        } catch {
          toast.error("Failed to upload image");
        }
      },
      "image/webp",
      0.8,
    );
  };

  const handleUploadClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div onClick={handleUploadClick}>
      {children}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        style={{ display: "none" }}
      />
    </div>
  );
}
