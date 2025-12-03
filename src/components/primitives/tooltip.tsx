"use client";

import React from "react";
import { TooltipContent, TooltipTrigger, Tooltip as UITooltip } from "../ui/tooltip";

export function Tooltip({
  children,
  content,
  open,
  defaultOpen,
  onOpenChange,
  delayDuration,
  side = "top",
  ...props
}: {
  children: React.ReactNode;
  hideArrow?: boolean;
  content: string | React.ReactNode;
  delayDuration?: number;
  open?: boolean;
  defaultOpen?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  onOpenChange?: (open: boolean) => void;
} & Omit<React.ComponentProps<typeof TooltipContent>, "content">) {
  return (
    <UITooltip
      delayDuration={delayDuration || 50}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        {...props}
        side={side}
        align="center"
      >
        {content}
      </TooltipContent>
    </UITooltip>
  );
}

export default Tooltip;
