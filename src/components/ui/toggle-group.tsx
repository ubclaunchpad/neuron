"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";

const toggleGroupVariants = cva(
  "group/toggle-group flex w-fit items-center rounded-md",
  {
    variants: {
      variant: {
        default: "",
        outline: "",
        tab: "rounded-lg bg-muted text-muted-foreground gap-1",
      },
      size: {
        default: "",
        sm: "",
        lg: "",
      },
    },
    compoundVariants: [
      { variant: "tab", size: "default", className: "p-1" },
      { variant: "tab", size: "sm", className: "p-0.5" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const toggleGroupItemVariants = cva(
  "w-auto min-w-0 shrink-0 focus:z-10 focus-visible:z-10",
  {
    variants: {
      variant: {
        default: "",
        outline: "",
        tab: "",
      },
      size: {
        default: "px-3",
        sm: "h-7 px-2.5",
        lg: "px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
});

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
  }) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        toggleGroupVariants({ variant, size }),
        "gap-[--spacing(var(--gap))] data-[spacing=default]:data-[variant=outline]:shadow-xs",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, spacing }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        toggleGroupItemVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        "data-[spacing=0]:not-data-[variant=tab]:rounded-none data-[spacing=0]:not-data-[variant=tab]:shadow-none data-[spacing=0]:not-data-[variant=tab]:first:rounded-l-md data-[spacing=0]:not-data-[variant=tab]:last:rounded-r-md data-[spacing=0]:data-[variant=outline]:border-l-0 data-[spacing=0]:data-[variant=outline]:first:border-l",
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants };
