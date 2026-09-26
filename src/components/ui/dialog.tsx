"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import {
  childrenFromAsChild,
  renderFromAsChild,
  type AsChildProps,
} from "@/lib/base-ui-compat";
import { TypographyTitle } from "./typography";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  asChild,
  children,
  render,
  ...props
}: DialogPrimitive.Trigger.Props & AsChildProps) {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      render={renderFromAsChild(asChild, children, render)}
      {...props}
    >
      {childrenFromAsChild(asChild, children)}
    </DialogPrimitive.Trigger>
  );
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  asChild,
  children,
  render,
  ...props
}: DialogPrimitive.Close.Props & AsChildProps) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      render={renderFromAsChild(asChild, children, render)}
      {...props}
    >
      {childrenFromAsChild(asChild, children)}
    </DialogPrimitive.Close>
  );
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  contentClassName,
  children,
  showCloseButton,
  hideCloseButton = false,
  asChild = false,
  ...props
}: DialogPrimitive.Popup.Props & {
  contentClassName?: string;
  showCloseButton?: boolean;
  hideCloseButton?: boolean;
  asChild?: boolean;
}) {
  const shouldShowCloseButton = showCloseButton ?? !hideCloseButton;
  const innerClassName = cn(
    "relative grid max-h-[calc(100dvh-2rem)] w-full gap-4 overflow-y-auto rounded-xl p-4 hide-scrollbar",
    contentClassName,
  );
  const content =
    asChild && React.isValidElement(children) ? (
      React.cloneElement(
        children as React.ReactElement<{ className?: string }>,
        {
          className: cn(
            innerClassName,
            (children.props as { className?: string }).className,
          ),
        },
      )
    ) : (
      <div className={innerClassName}>{children}</div>
    );

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid max-h-lvh w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-background text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      >
        {content}
        {shouldShowCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "sticky -bottom-4 -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-[color-mix(in_srgb,var(--muted)_50%,white)] p-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  children,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    >
      <TypographyTitle>{children}</TypographyTitle>
    </DialogPrimitive.Title>
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
