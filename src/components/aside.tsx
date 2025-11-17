"use client";

import * as React from "react";

import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import CloseIcon from "@public/assets/icons/close.svg";
import { usePageAside } from "./page-layout";
import { TypographyTitle } from "./primitives/typography";

function AsideContainer({
  className,
  children,
  hideClose,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hideClose?: boolean }) {
  return (
    <div
      data-slot="aside-container"
      className={cn(
        "pt-[4.25rem] pr-9 pb-9 pl-5 gap-6 space-y-8 relative",
        className,
      )}
      {...props}
    >
      {!hideClose && <AsideClose className="absolute top-8 right-6"/>}
      {children}
    </div>
  );
}

function AsideHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="aside-header"
      className={cn(
        "space-y-2",
        className,
      )}
      {...props}
    />
  );
}

function AsideTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <TypographyTitle
      data-slot="aside-title"
      className={cn("inline-block text-lg font-semibold", className)}
      {...props}
    />
  );
}

function AsideDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="aside-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function AsideClose({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick">) {
  const { setOpen } = usePageAside();
  return (
    <Button
      data-slot="aside-close"
      variant="ghost"
      size="icon"
      className={cn("shrink-0 text-muted-foreground", className)}
      aria-label="Close aside"
      onClick={() => setOpen(false)}
      {...props}
    >
      <CloseIcon className="size-4" />
    </Button>
  );
}

function AsideBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="aside-body"
      className={cn("space-y-6", className)}
      {...props}
    />
  );
}

function AsideSection({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      data-slot="aside-section"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function AsideSectionHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <div
      data-slot="aside-section"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function AsideSectionTitle({
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <TypographyTitle
      data-slot="aside-section"
      {...props}
    />
  );
}

function AsideSectionContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <div
      data-slot="aside-section"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

function AsideField({
  className,
  inline = true,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  inline?: boolean;
}) {
  return (
    <div
      data-slot="aside-field"
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

function AsideFieldLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <h3
      data-slot="aside-field-label"
      className={cn("self-center font-medium", className)}
      {...props}
    />
  );
}

function AsideFieldContent({
  className,
  full = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { full?: boolean }) {
  return (
    <p
      data-slot="aside-field-content"
      data-full={full}
      className={cn("flex flex-col align-center justify-center text-sm text-muted-foreground gap-1", full && "col-span-2", className)}
      {...props}
    />
  );
}

export {
  AsideBody,
  AsideClose,
  AsideContainer,
  AsideDescription,
  AsideField,
  AsideFieldContent,
  AsideFieldLabel,
  AsideHeader,
  AsideSection,
  AsideSectionContent,
  AsideSectionHeader,
  AsideSectionTitle,
  AsideTitle
};

