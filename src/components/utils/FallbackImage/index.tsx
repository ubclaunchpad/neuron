import React from "react";

export interface FallbackImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  name?: string | null;
  fallbackUrl?: string;
}

export const FallbackImage = React.forwardRef<HTMLImageElement, FallbackImageProps>(
  ({ src, name, fallbackUrl,className, alt, ...rest }, ref) => {
    fallbackUrl ??= `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || "")}`;

    const handleImageError = (
      e: React.SyntheticEvent<HTMLImageElement, Event>,
    ) => {
      if (e.currentTarget.src !== fallbackUrl) {
        e.currentTarget.src = fallbackUrl;
      }
    };

    return (
      <img
        ref={ref}
        className={className}
        src={src ?? fallbackUrl}
        alt={alt ?? name ?? ""}
        onError={handleImageError}
        {...rest}
      />
    );
  },
);

FallbackImage.displayName = "FallbackImage";
