import clsx from "clsx";
import React from "react";
import "./index.scss";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
    return (
      <div
        className={clsx("skeleton", className)}
        {...props}
      />
    )
}

export function SkeletonButton({ className, ...props }: React.ComponentProps<"div">) {
    return (
      <div
        className={clsx("skeleton", "skeleton__button", className)}
        {...props}
      />
    )
}

export function SkeletonText({ className, ...props }: React.ComponentProps<"div">) {
    return (
      <div
        className={clsx("skeleton", "skeleton__text", className)}
        {...props}
      />
    )
}