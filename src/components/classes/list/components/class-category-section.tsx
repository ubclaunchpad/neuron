"use client";

import * as React from "react";

import { TypographyTitle } from "@/components/ui/typography";

export function ClassCategorySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-7 scroll-mt-9 items-stretch">
      <TypographyTitle className="pt-4 pb-2 border-b border-border">
        {title}
      </TypographyTitle>
      {children}
    </section>
  );
}
