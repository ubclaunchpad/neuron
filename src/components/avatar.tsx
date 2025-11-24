import { cn } from "@/lib/utils";
import {
  AvatarFallback,
  AvatarImage,
  Avatar as AvatarPrimitive,
} from "./primitives/avatar";

export function Avatar({
  src,
  fallbackText,
  className,
}: {
  src: string | undefined;
  fallbackText: string;
  className?: string;
}) {
  return (
    <AvatarPrimitive className={cn("aspect-square shrink-0 h-auto rounded-md pointer-events-none [container-type:inline-size]", className)}>
      <AvatarImage
        src={src}
        alt={fallbackText}
        className="rounded-md object-cover"
      />
      <AvatarFallback className="rounded-md text-[50cqw]">
        {fallbackText.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </AvatarPrimitive>
  );
}
