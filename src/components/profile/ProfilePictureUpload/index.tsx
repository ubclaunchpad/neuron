"use client";

import { FallbackImage } from "@/components/utils/FallbackImage";
import { clientApi } from "@/trpc/client";
import { useRef, useState } from "react";
import { useAuth } from "@/providers/client-auth-provider";
import { hasPermission } from "@/lib/auth/extensions/permissions";
import { toast } from "sonner";
import EditIcon from "@public/assets/icons/edit.svg";
import "./index.scss";

interface ProfilePictureUploadProps {
  currentImage?: string;
  name?: string;
  disabled?: boolean;
  userId?: string;
}

export function ProfilePictureUpload({
  currentImage,
  name,
  disabled = false,
  userId,
}: ProfilePictureUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const updateProfileMutation = clientApi.profile.update.useMutation();
  const getPresignedUrlMutation = clientApi.profile.getPresignedUrl.useMutation();
  const getPresignedUrl = async (userId: string, fileExtension: string) => {
    const response = await getPresignedUrlMutation.mutateAsync({ userId, fileExtension });
    return response.url;
  }

  const createCanvas = (width: number, height: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  const createContext = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    return ctx;
  }

  const centerImage = (img: HTMLImageElement, targetSize: number) => {
    const sourceWidth = img.width;
    const sourceHeight = img.height;
    const cropSize = Math.min(sourceWidth, sourceHeight);
    const sourceX = (sourceWidth - cropSize) / 2;
    const sourceY = (sourceHeight - cropSize) / 2;
    return { sourceX, sourceY, cropSize };
  }

  const hasAccessToUpdateProfile = () => {
    return hasPermission({...{ permission: { profile: ["update"] } }, user});
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!hasAccessToUpdateProfile()) {
      toast.error("You do not have permission to update your profile");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      toast.error("No file selected");
      return;
    }

    const targetSize = 120;
    const fileExtension = file.name.split(".").pop() ?? "";
    const presignedUrl = await getPresignedUrl(userId ?? "", fileExtension);
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

    const canvas = createCanvas(targetSize, targetSize);
    const ctx = createContext(canvas);
    if (!ctx) return;

    const { sourceX, sourceY, cropSize } = centerImage(img, targetSize);

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      cropSize,
      cropSize,
      0,
      0,
      targetSize,
      targetSize,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setPreviewUrl(URL.createObjectURL(blob));

        if (!presignedUrl) {
          toast.error("Failed to get presigned URL");
          return;
        }
        
        uploadFileToMinIO(presignedUrl, blob);
        updateProfileMutation.mutate({
          userId: userId ?? "",
          imageUrl: `user_${userId}/profile-picture.${fileExtension}`,  
        });
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
      toast.success("Profile picture updated successfully");
    } else {
      toast.error("Failed to update profile picture");
    }
  }

  const handleUploadClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className="profile-picture-upload" onClick={handleUploadClick}>
      <div className="profile-picture-upload__container">
        <div className="profile-picture-upload__image">
          <FallbackImage src={displayImage} name={name} />
          <div className="profile-picture-upload__overlay">
            <EditIcon
              className="profile-picture-upload__icon"
              width={24}
              height={24}
            />
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="profile-picture-upload__input"
        disabled={disabled}
      />
    </div>
  );
}