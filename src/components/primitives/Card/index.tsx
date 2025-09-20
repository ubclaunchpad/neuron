"use client";

import clsx from "clsx";
import * as React from "react";
import "./index.scss";

export type CardVariant = "default" | "success" | "error";
export type CardSize = "small" | "default";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  size?: CardSize;
  className?: string;
};

export function Card({ className, variant, size, ...props }: CardProps) {
  return <div {...props} className={clsx("card", variant, size, className)} />;
}
