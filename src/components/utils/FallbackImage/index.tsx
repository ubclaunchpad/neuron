import React, { useState } from "react";
import Image from "next/image";

export interface FallbackImageProps
  extends Omit<React.ComponentProps<typeof Image>, "src" | "alt"> {
  src?: string | null;
  name?: string | null;
  fallbackUrl?: string;
  alt?: string;
}

export const FallbackImage = React.forwardRef<HTMLImageElement, FallbackImageProps>(
  ({ src, name, fallbackUrl, className, alt, ...rest }, ref) => {
    const defaultFallback = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name ?? "")}`;
    const finalFallbackUrl = fallbackUrl ?? defaultFallback;
    
    const [imgSrc, setImgSrc] = useState<string>(src ?? finalFallbackUrl);

    const handleImageError = () => {
      if (imgSrc !== finalFallbackUrl) {
        setImgSrc(finalFallbackUrl);
      }
    };

    return (
      <Image
        ref={ref}
        className={className}
        src={imgSrc}
        alt={alt ?? name ?? ""}
        onError={handleImageError}
        {...rest}
      />
    );
  },
);

FallbackImage.displayName = "FallbackImage";
