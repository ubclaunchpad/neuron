"use client";

import { FallbackImage } from "@/components/utils/FallbackImage";
import { useRef, useState } from "react";
import EditIcon from "@public/assets/icons/edit.svg";
import "./index.scss";

interface ProfilePictureUploadProps {
  currentImage?: string;
  name?: string;
  onImageChange?: (file: File) => void;
  disabled?: boolean;
}

export function ProfilePictureUpload({
  currentImage,
  name,
  onImageChange,
  disabled = false,
}: ProfilePictureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create image element and wait for it to load
      const img = new Image();
      
      // Wait for image to load before processing
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;

      // Use high-quality native canvas resize
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Calculate aspect ratio and crop to square
        const sourceWidth = img.width;
        const sourceHeight = img.height;
        const targetSize = 120;
        
        // Find the smaller dimension to create a square crop
        const cropSize = Math.min(sourceWidth, sourceHeight);
        const sourceX = (sourceWidth - cropSize) / 2;
        const sourceY = (sourceHeight - cropSize) / 2;
        
        // Draw the cropped and resized image
        ctx.drawImage(
          img,
          sourceX, sourceY, cropSize, cropSize, 
          0, 0, targetSize, targetSize
        );
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            console.log("Resized blob:", blob);
            const url = URL.createObjectURL(blob);
            console.log('Preview URL:', url);
            setPreviewUrl(url);
            onImageChange?.(new File([blob], file.name, { type: file.type }));
          }
        }, file.type, 0.9);
      }
    }
  };

  const handleUploadClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const displayImage = previewUrl || currentImage;
  console.log('Display image:', displayImage, 'Preview URL:', previewUrl, 'Current image:', currentImage);

  return (
    <div className="profile-picture-upload" onClick={handleUploadClick}>
      <div className="profile-picture-upload__container">
        <div className="profile-picture-upload__image">
          <FallbackImage src={displayImage} name={name} />
          <div className="profile-picture-upload__overlay">
              <EditIcon className="profile-picture-upload__icon" width={24} height={24} />
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
