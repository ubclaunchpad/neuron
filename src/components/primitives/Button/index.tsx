"use client";

import clsx from "clsx";
import { forwardRef, type ForwardedRef } from "react";
import {
  Button as AriaButton,
  Link as AriaLink,
  type ButtonProps as AriaButtonProps,
  type LinkProps as AriaLinkProps,
} from "react-aria-components";
import { ActiveContext } from "../../utils/ActiveContext";
import "./index.scss";

type Common = {
  unstyled?: boolean;
  variant?: "button" | "link";
  className?: string;
};

type ButtonOnlyProps = Omit<AriaButtonProps, "className"> &
  Common & { href?: never };
type LinkOnlyProps = Omit<AriaLinkProps, "className"> &
  Common & { href: string };
export type ButtonLikeProps = ButtonOnlyProps | LinkOnlyProps;

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonLikeProps
>(
  (
    {
      unstyled = false,
      variant = "button",
      className,
      href,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = unstyled ? className : clsx(variant, className);

    if (href) {
      return (
        <ActiveContext href={href}>
          {({ isActive }) => (
            <AriaLink
              ref={ref as ForwardedRef<HTMLAnchorElement>}
              href={href}
              className={classes}
              aria-current={isActive ? "page" : undefined}
              {...props as any}
            >
              {children}
            </AriaLink>
          )}
        </ActiveContext>
      );
    }

    return (
      <AriaButton
        ref={ref as ForwardedRef<HTMLButtonElement>}
        className={classes}
        {...(props as ButtonOnlyProps)}
      >
        {children as ButtonOnlyProps["children"]}
      </AriaButton>
    );
  },
);

Button.displayName = "Button";
