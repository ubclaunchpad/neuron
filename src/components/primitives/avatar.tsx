"use client"

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as React from "react";

import { cn } from "@/lib/utils";
import { createPrng } from "@/utils/prngUtils";
import { useMemo } from "react";

const backgroundColors = [
  "#00acc1",
  "#1e88e5",
  "#5e35b1",
  "#7cb342",
  "#8e24aa",
  "#039be5",
  "#43a047",
  "#00897b",
  "#3949ab",
  "#c0ca33",
  "#d81b60",
  "#e53935",
  "#f4511e",
  "#fb8c00",
  "#fdd835",
  "#ffb300"
];

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    children?: string
  }
>(({ className, children, ...props }, ref) => {
  const bgColor = useMemo(() => {
    const prng = createPrng(children);
    return prng.shuffle(backgroundColors)[0]!;
  }, [children]);

  return <AvatarPrimitive.Fallback
    ref={ref}
    style={{ '--avatar-bg': bgColor } as React.CSSProperties}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full text-md text-primary-foreground",
      "bg-(--avatar-bg)",
      className
    )}
    {...props}
  >{children}</AvatarPrimitive.Fallback>
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarFallback, AvatarImage };
