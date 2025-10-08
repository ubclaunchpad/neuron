"use client";

import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";
import * as React from "react";
import "./index.scss";

export type CardVariant = "default" | "success" | "error";
export type CardSize = "small" | "default";

type BaseCardProps = {
  /** When true, Card won’t render a div—it will pass props to its single child */
  asChild?: boolean;
  variant?: CardVariant;
  size?: CardSize;
  className?: string;
};

type CardProps = BaseCardProps & React.ComponentPropsWithoutRef<"div">;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ asChild, variant, size, className, children, ...rest }, ref) => {
    const Comp = asChild ? Slot : "div";
    const classes = clsx("card", variant, size, className);

    return (
      <Comp ref={ref as any} className={classes} {...rest}>
        {children}
      </Comp>
    );
  }
);

Card.displayName = "Card";
