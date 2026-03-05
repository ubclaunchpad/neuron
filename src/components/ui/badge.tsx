import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg:not([class*='size-'])]:size-3 gap-1 has-[>svg]:px-1.5",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-primary-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        notification:
          "border-transparent bg-destructive/80 text-primary-foreground shadow h-5 min-w-5 px-1.5 flex justify-center items-center border-none",
        filter: "border-transparent rounded font-medium px-1 py-px",
        colored: "border-transparent",
      },
      color: {
        default: "",
        muted: "bg-muted text-foreground",
        emphasis: "bg-emphasis text-emphasis-foreground",
        primary: "bg-primary/10 text-primary",
        success: "bg-emerald-50 text-emerald-700",
        warning: "bg-amber-50 text-amber-800",
        error: "bg-destructive text-destructive/20",
        info: "bg-blue-50 text-blue-700",
      },
    },
    compoundVariants: [],
    defaultVariants: {
      variant: "default",
      color: "default",
    },
  },
);

export interface BadgeProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, color, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({
          variant,
          color,
        }),
        className,
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
