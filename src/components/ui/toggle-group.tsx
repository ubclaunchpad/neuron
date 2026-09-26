"use client";

import * as React from "react";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
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
      size: { default: "", sm: "", lg: "" },
    },
    compoundVariants: [
      { variant: "tab", size: "default", className: "p-1" },
      { variant: "tab", size: "sm", className: "p-0.5" },
    ],
    defaultVariants: { variant: "default", size: "default" },
  },
);

const toggleGroupItemVariants = cva(
  "w-auto min-w-0 shrink-0 focus:z-10 focus-visible:z-10",
  {
    variants: {
      variant: { default: "", outline: "", tab: "" },
      size: { default: "px-3", sm: "h-7 px-2.5", lg: "px-3" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type BaseToggleGroupProps = Omit<
  ToggleGroupPrimitive.Props,
  "value" | "defaultValue" | "onValueChange" | "multiple"
>;

type ToggleGroupSelectionProps =
  | {
      type?: "single";
      value?: string;
      defaultValue?: string;
      onValueChange?: (value: string) => void;
    }
  | {
      type: "multiple";
      value?: string[];
      defaultValue?: string[];
      onValueChange?: (value: string[]) => void;
    };

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
  orientation: "horizontal",
});

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  orientation = "horizontal",
  children,
  type = "single",
  value,
  defaultValue,
  onValueChange,
  ...props
}: BaseToggleGroupProps &
  ToggleGroupSelectionProps &
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
  }) {
  const normalizedValue =
    type === "multiple"
      ? (value as string[] | undefined)
      : value
        ? [value as string]
        : undefined;
  const normalizedDefaultValue =
    type === "multiple"
      ? (defaultValue as string[] | undefined)
      : defaultValue
        ? [defaultValue as string]
        : undefined;

  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        toggleGroupVariants({ variant, size }),
        "gap-[--spacing(var(--gap))] data-[spacing=default]:data-[variant=outline]:shadow-xs data-[orientation=vertical]:flex-col",
        className,
      )}
      multiple={type === "multiple"}
      value={normalizedValue}
      defaultValue={normalizedDefaultValue}
      onValueChange={(nextValue) => {
        if (type === "multiple") {
          (onValueChange as ((value: string[]) => void) | undefined)?.(
            nextValue,
          );
        } else {
          (onValueChange as ((value: string) => void) | undefined)?.(
            nextValue[0] ?? "",
          );
        }
      }}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, spacing, orientation }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <TogglePrimitive
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
    </TogglePrimitive>
  );
}

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants };
