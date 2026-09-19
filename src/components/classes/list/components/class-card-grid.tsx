import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function ClassCardGrid({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(min(100%,258px),258px))] gap-6 px-5",
        className,
      )}
      {...props}
    />
  );
}
