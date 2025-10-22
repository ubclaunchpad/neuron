"use client";

import { FallbackImage } from "@/components/utils/FallbackImage";
import { FilePicker } from "@/components/primitives/FilePicker";
import { useAuth } from "@/providers/client-auth-provider";
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
  const displayImage = currentImage ?? user?.image ?? undefined;

  return (
    <div className="profile-picture-upload">
      <FilePicker
        objectType="user"
        id={userId ?? user?.id ?? ""}
        disabled={disabled}
        targetSize={120}
        // TODO: update image for user in DB
        // onUploaded={(objectKey) => {
        //   const base = process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL!;
        //   const bucket = process.env.NEXT_PUBLIC_MINIO_BUCKET!;
        //   const imageUrl = `${base}/${bucket}/${objectKey}`;
        //   clientApi.profile.update.mutate({ userId: userId ?? user!.id, imageUrl });
        // }}
      >
        <div className="profile-picture-upload__container">
          <div className="profile-picture-upload__image">
            <FallbackImage src={displayImage} name={name} />
            <div className="profile-picture-upload__overlay">
              <EditIcon className="profile-picture-upload__icon" width={24} height={24} />
            </div>
          </div>
        </div>
      </FilePicker>
    </div>
  );
}