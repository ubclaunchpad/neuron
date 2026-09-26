import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-base leading-none font-normal whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground not-disabled:hover:bg-primary/90",
        destructive:
          "bg-destructive text-white not-disabled:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        "destructive-outline":
          "border border-input bg-background text-destructive shadow-xs not-disabled:hover:bg-destructive/10 not-disabled:hover:text-destructive dark:bg-input/30 dark:not-disabled:hover:bg-destructive/20",
        outline:
          "border bg-background shadow-xs not-disabled:hover:bg-accent not-disabled:hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:not-disabled:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground not-disabled:hover:bg-secondary/80",
        ghost:
          "not-disabled:hover:bg-accent not-disabled:hover:text-accent-foreground dark:not-disabled:hover:bg-accent/50",
        link: "text-secondary-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
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
  render,
  nativeButton = !asChild,
  children,
  ...props
}: Omit<ButtonPrimitive.Props, "className" | "render"> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    asChild?: boolean;
    unstyled?: boolean;
    render?: ButtonPrimitive.Props["render"];
  }) {
  const childRender =
    asChild && React.isValidElement(children) ? children : render;

  return (
    <ButtonPrimitive
      type={asChild ? undefined : type}
      nativeButton={nativeButton}
      data-slot="button"
      className={cn(
        !unstyled && buttonVariants({ variant, size, loading }),
        className,
      )}
      render={childRender}
      {...props}
    >
      {asChild ? undefined : children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
