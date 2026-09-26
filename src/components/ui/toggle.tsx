"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 aria-pressed:bg-accent aria-pressed:text-accent-foreground data-pressed:bg-accent data-pressed:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground",
        tab: "rounded-md bg-transparent text-muted-foreground hover:bg-black/5 hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow data-pressed:bg-background data-pressed:text-foreground data-pressed:shadow dark:hover:bg-white/5",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant = "default",
  size = "default",
  unstyled,
  ...props
}: TogglePrimitive.Props &
  VariantProps<typeof toggleVariants> & { unstyled?: boolean }) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(
        !unstyled && toggleVariants({ variant, size, className }),
        className,
      )}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
