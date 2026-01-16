import { cn } from "@/lib/utils";
import {
  AvatarFallback,
  AvatarImage,
  Avatar as AvatarPrimitive,
} from "../ui/avatar";
import { nullthy } from "@/lib/nullthy";

export function Avatar({
  src,
  fallbackText,
  className,
}: {
  src: string | nullthy;
  fallbackText: string;
  className?: string;
}) {
  return (
    <AvatarPrimitive
      className={cn(
        "aspect-square shrink-0 h-auto rounded-md pointer-events-none [container-type:inline-size]",
        className,
      )}
    >
      <AvatarImage
        src={src ?? undefined}
        alt={fallbackText}
        className="object-cover"
      />
      <AvatarFallback className="text-[50cqw]">
        {fallbackText.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </AvatarPrimitive>
  );
}
