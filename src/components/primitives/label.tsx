"use client"

import * as LabelPrimitive from "@radix-ui/react-label"
import * as React from "react"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-base leading-none font-normal select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function LabelRequiredMarker({
  className,
  ...props
}: Omit<React.ComponentProps<"i">, "children">) {
  return (
    <span
      data-slot="label-required-marker"
      className={cn(
        "text-destructive",
        className
      )}
      {...props}
    >*</span>
  )
}

export { Label, LabelRequiredMarker }
