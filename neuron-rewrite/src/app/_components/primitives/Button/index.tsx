"use client";

import clsx from "clsx";
import { forwardRef } from "react";
import { Button as AriaButton, Link as AriaLink, type ButtonProps as AriaButtonProps, type LinkProps as AriaLinkProps } from "react-aria-components";
import "./index.scss";

type Size = "default" | "small";
type Variant = "button" | "link";
type Scheme = "primary" | "secondary";
type Tone = "default" | "positive" | "negative";

type Common = {
  size?: Size;
  variant?: Variant;
  tone?: Tone;
  scheme?: Scheme;
  className?: string;
};

/** If href is present -> Link; else -> Button */
export type ButtonLikeProps =
  | (Omit<AriaButtonProps, "className"> & Common & { href?: undefined })
  | (Omit<AriaLinkProps, "className"> & Common & { href: string });

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonLikeProps>(
  ({
    variant = "button",
    scheme = "primary",
    size,
    tone,
    className,
    href,
    ...rest
  }, ref) => {
    const classes = clsx(variant, scheme, size, tone, className);

    if (href) {
        return <AriaLink ref={ref as any} href={href} className={classes} {...(rest as AriaLinkProps)} />;
    } else {
        return <AriaButton ref={ref as any} className={classes} {...(rest as AriaButtonProps)} />;
    }
  }
);

Button.displayName = "Button";
