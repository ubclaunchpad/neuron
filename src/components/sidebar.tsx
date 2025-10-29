"use client";

import * as React from "react";

import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import CloseIcon from "@public/assets/icons/close.svg";
import { usePageSidebar } from "./page-layout";
import { TypographyTitle } from "./primitives/typography";

function SidebarContainer({
  className,
  children,
  hideClose,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hideClose?: boolean }) {
  return (
    <div
      data-slot="sidebar-container"
      className={cn(
        "pt-[4.25rem] pr-9 pb-9 pl-5 flex flex-col gap-5 relative",
        className,
      )}
      {...props}
    >
      {!hideClose && <SidebarClose className="absolute top-8 right-6"/>}
      {children}
    </div>
  );
}

function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn(
        "flex items-start justify-between gap-2 border-b border-border pb-6",
        className,
      )}
      {...props}
    />
  );
}

function SidebarTitle({
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <TypographyTitle
      data-slot="sidebar-title"
      {...props}
    />
  );
}

function SidebarDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="sidebar-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function SidebarClose({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick">) {
  const { setOpen } = usePageSidebar();
  return (
    <Button
      data-slot="sidebar-close"
      variant="ghost"
      size="icon"
      className={cn("shrink-0 text-muted-foreground", className)}
      aria-label="Close sidebar"
      onClick={() => setOpen(false)}
      {...props}
    >
      <CloseIcon className="size-4" />
    </Button>
  );
}

function SidebarBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-body"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function SidebarFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("mt-2", className)}
      {...props}
    />
  );
}

function SidebarSection({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      data-slot="sidebar-section"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function SidebarSectionHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <div
      data-slot="sidebar-section"
      className={cn("flex flex-row gap-2", className)}
      {...props}
    />
  );
}

function SidebarSectionContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <div
      data-slot="sidebar-section"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

function SidebarField({
  className,
  inline = true,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  inline?: boolean;
}) {
  return (
    <div
      data-slot="sidebar-field"
      data-inline={inline}
      className={cn(
        "grid gap-1",
        inline ? "[grid-template-columns:4fr_6fr] gap-2" : "grid-cols-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function SidebarFieldLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-field-label"
      className={cn("self-center text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function SidebarFieldContent({
  className,
  full = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { full?: boolean }) {
  return (
    <div
      data-slot="sidebar-field-content"
      data-full={full}
      className={cn("flex flex-col gap-1", full && "col-span-2", className)}
      {...props}
    />
  );
}

export {
  SidebarBody,
  SidebarClose,
  SidebarContainer,
  SidebarDescription,
  SidebarField,
  SidebarFieldContent,
  SidebarFieldLabel,
  SidebarFooter,
  SidebarHeader,
  SidebarSection,
  SidebarSectionContent,
  SidebarSectionHeader,
  SidebarTitle
};

