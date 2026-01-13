import { Button as UIButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Slottable } from "@radix-ui/react-slot";
import Link from "next/link";
import React from "react";
import { Tooltip } from "../primitives/tooltip";
import { Skeleton } from "../ui/skeleton";
import { Spinner } from "../ui/spinner";

type LinkProps = React.ComponentProps<typeof Link>;
type ButtonComponentProps = Omit<LinkProps, "href" | "children"> &
  Omit<React.ComponentProps<typeof UIButton>, "children"> &
  Omit<React.ComponentProps<typeof TooltipWrapper>, "children"> & {
    children?: React.ReactNode;
    href?: LinkProps["href"];
    pending?: boolean;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    skeletonClassName?: string;
  };

export function Button({
  children,
  pending,
  startIcon,
  endIcon,
  skeletonClassName,
  tooltip,
  tooltipSide,
  tooltipOffset,
  tooltipClassName,
  tooltipHideArrow,
  asChild,
  ...props
}: ButtonComponentProps) {
  const { loading } = props;

  // Pending buttons should be disabled
  props.disabled ??= pending;

  if (loading) {
    <Skeleton
      className={cn(
        "w-40",
        props.size === "sm" ? "h-8" : "h-10",
        skeletonClassName,
      )}
    />;
  }

  const content = (
    <>
      {pending ? <Spinner /> : startIcon}
      <div
        className={cn(props.size?.startsWith("icon") ? "sr-only" : "contents")}
      >
        {children}
      </div>
      {endIcon}
    </>
  );

  let buttonContent = props.href ? (
    <UIButton asChild {...props}>
      <Link href={props.href}>{content}</Link>
    </UIButton>
  ) : asChild ? (
    <UIButton asChild {...props}>
      {pending ? <Spinner /> : startIcon}
      <Slottable>{children}</Slottable>
      {endIcon}
    </UIButton>
  ) : (
    <UIButton {...props}>{content}</UIButton>
  );

  if (tooltip) {
    buttonContent = (
      <TooltipWrapper
        tooltip={tooltip}
        tooltipSide={tooltipSide}
        tooltipOffset={tooltipOffset}
        tooltipClassName={tooltipClassName}
        tooltipHideArrow={tooltipHideArrow}
      >
        {buttonContent}
      </TooltipWrapper>
    );
  }

  return buttonContent;
}

type ButtonTooltipProps = {
  tooltip?: React.ReactNode;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipOffset?: number;
  tooltipClassName?: string;
  tooltipHideArrow?: boolean;
};

const TooltipWrapper = ({
  children,
  tooltip,
  tooltipSide = "top",
  tooltipOffset = 3,
  tooltipClassName,
  tooltipHideArrow = true,
}: ButtonTooltipProps & {
  children: React.ReactNode;
}) => {
  if (!tooltip) {
    return <>{children}</>;
  }

  return (
    <Tooltip
      className={tooltipClassName}
      content={tooltip}
      side={tooltipSide}
      sideOffset={tooltipOffset}
      hideArrow={tooltipHideArrow}
    >
      {children}
    </Tooltip>
  );
};
