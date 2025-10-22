"use client";

import { clientApi } from "@/trpc/client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ObjectType } from "@/models/interfaces";
import type { ReactNode } from "react";

interface FilePickerProps {
  objectType: ObjectType; // "user" | "class"
  id: string; // user id or class id
  disabled?: boolean;
  targetSize?: number; // default 120x120
  onUploaded?: (objectKey: string) => void;
  children?: ReactNode; // clickable trigger content
}

export function FilePicker({ objectType, id, disabled = false, targetSize = 120, onUploaded, children }: FilePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getPresignedUrlMutation = clientApi.profile.getPresignedUrl.useMutation();
  const getPresignedUrl = async (objectTypeArg: ObjectType, objectId: string, fileExtension: string) => {
    const response = await getPresignedUrlMutation.mutateAsync({ objectType: objectTypeArg, id: objectId, fileExtension });
    return response.url;
  };

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

    const fileExtension = file.name.split(".").pop() ?? "";
    const presignedUrl = await getPresignedUrl(objectType, id, fileExtension);
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
        setPreviewUrl(URL.createObjectURL(blob));

        if (!presignedUrl) {
          toast.error("Failed to get presigned URL");
          return;
        }

        const ok = await uploadFileToMinIO(presignedUrl, blob);
        if (ok) {
          const objectKey = `${objectType}/${objectType}_${id}/profile-picture.${fileExtension}`;
          onUploaded?.(objectKey);
        }
      },
      file.type,
      0.9,
    );
  };

  const uploadFileToMinIO = async (presignedUrl: string, blob: Blob) => {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": blob.type,
      },
      body: blob,
    });
    if (response.ok) {
      toast.success("Image uploaded successfully");
      return true;
    }
    toast.error("Failed to upload image");
    return false;
  };

  const handleUploadClick = () => {
    console.log("handleUploadClick");
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
