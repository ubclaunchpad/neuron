"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";
import {
  childrenFromAsChild,
  renderFromAsChild,
  type AsChildProps,
} from "@/lib/base-ui-compat";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  asChild,
  children,
  render,
  ...props
}: PopoverPrimitive.Trigger.Props & AsChildProps) {
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      render={renderFromAsChild(asChild, children, render)}
      {...props}
    >
      {childrenFromAsChild(asChild, children)}
    </PopoverPrimitive.Trigger>
  );
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  onOpenAutoFocus,
  onCloseAutoFocus,
  initialFocus,
  finalFocus,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & {
    onOpenAutoFocus?: (event: { preventDefault: () => void }) => void;
    onCloseAutoFocus?: (event: { preventDefault: () => void }) => void;
  }) {
  const mapAutoFocus = (
    handler: ((event: { preventDefault: () => void }) => void) | undefined,
    fallback: typeof initialFocus,
  ) => {
    if (!handler) return fallback;
    return () => {
      let prevented = false;
      handler({ preventDefault: () => (prevented = true) });
      return prevented ? false : undefined;
    };
  };

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          initialFocus={mapAutoFocus(onOpenAutoFocus, initialFocus)}
          finalFocus={mapAutoFocus(onCloseAutoFocus, finalFocus)}
          className={cn(
            "z-50 w-72 origin-(--transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({ ...props }: PopoverPrimitive.Positioner.Props) {
  return <PopoverPrimitive.Positioner data-slot="popover-anchor" {...props} />;
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-0.5 text-sm", className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  PopoverAnchor,
};
