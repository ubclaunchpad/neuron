import React from "react";
import "./index.css";


export default function ProfileImg({
  src,
  name,
  className,
}) {
  const fallbackUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;

  const handleImageError = (e) => {
    if (e.target.src !== fallbackUrl) {
      e.target.src = fallbackUrl;
    }
  };

  if (name)
    return <img
    className={className}
      src={src ?? fallbackUrl}
      alt={name}
      width={40}
      height={40}
      onError={handleImageError}
    />
  else
    return null
}
