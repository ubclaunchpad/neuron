"use client";

import ErrorIcon from "@public/assets/icons/error.svg";
import clsx from "clsx";
import "./index.scss";

type ErrorLineProps = React.HTMLAttributes<HTMLDivElement> & {
  message?: React.ReactNode;
  icon?: React.ReactNode | null;
};

export function ErrorLine({
  message,
  icon = <ErrorIcon />,
  className,
  ...divProps
}: ErrorLineProps) {
  if (!message) return null;
  return (
    <div
      {...divProps}
      className={clsx("field-error", className)}
      role="alert"
      aria-live="polite"
    >
      {icon}
      <span className="field-error__message">{message}</span>
    </div>
  );
}
