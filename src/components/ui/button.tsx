import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-normal transition-all disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive leading-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary border-primary text-primary-foreground not-disabled:hover:bg-primary/90",
        destructive:
          "bg-destructive text-white not-disabled:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        "destructive-outline":
          "text-destructive border-destructive not-disabled:hover:text-destructive not-disabled:hover:bg-destructive/10 border bg-background shadow-xs dark:bg-input/30 dark:border-input dark:not-disabled:hover:bg-input/50",
        outline:
          "border bg-background shadow-xs not-disabled:hover:bg-accent not-disabled:hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:not-disabled:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground not-disabled:hover:bg-secondary/80",
        ghost:
          "not-disabled:hover:bg-accent not-di:hover:text-accent-foreground dark:not-disabled:hover:bg-accent/50",
        link: "text-secondary-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
      loading: {
        true: "cursor-wait",
      },
    },
    compoundVariants: [{ variant: "link", class: "h-fit px-0 py-0" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  loading,
  type = "button",
  asChild = false,
  unstyled = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    unstyled?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  // If disabled, prevent going through onclick
  props.onClick = props.disabled
    ? (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
      }
    : props.onClick;

  return (
    <Comp
      type={type}
      data-slot="button"
      className={cn(
        !unstyled && buttonVariants({ variant, size, loading }),
        className,
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
