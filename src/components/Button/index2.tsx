"use client";

import clsx from "clsx";
import type { Route } from "next";
import type { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, type ForwardedRef } from "react";
import {
  Button as AriaButton,
  Link as AriaLink,
  type ButtonProps as AriaButtonProps,
  type LinkProps as AriaLinkProps,
} from "react-aria-components";
import url from "url";
import { ActiveContext } from "../utils/active-context";
import "./index.scss";

type Common = {
  unstyled?: boolean;
  variant?: "button" | "link";
  className?: string;
};

type Href = LinkProps<Route>["href"];

type ButtonOnlyProps = Omit<AriaButtonProps, "className" | "href"> &
  Common & { href?: never };
type LinkOnlyProps = Omit<AriaLinkProps, "className" | "href"> &
  Common & { href: Href };
export type ButtonLikeProps = ButtonOnlyProps | LinkOnlyProps;


const Button = forwardRef<
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
    const router = useRouter();

    if (href) {
      const renderedHref: Route = (typeof href === "string" ? href : url.format(href)) as Route;
      
      const { onMouseEnter, ...rest } = props;
      const onMouseEnterPrefetch = (e: any) => {
        onMouseEnter?.(e);
        router.prefetch(renderedHref);
      };

      return (
        <ActiveContext url={renderedHref}>
          {({ isActive }) => (
            <AriaLink
              ref={ref as ForwardedRef<HTMLAnchorElement>}
              href={renderedHref}
              className={classes}
              aria-current={isActive ? "page" : undefined}
              onMouseEnter={onMouseEnterPrefetch}
              {...rest as any}
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


const ButtonGroup = ({ 
  children, 
  ...props 
}: { 
  children: React.ReactNode, 
  className?: string 
}) => {
  return <div className={clsx("button-group", props.className)}>
    {children}
  </div>;
};

ButtonGroup.displayName = "ButtonGroup";