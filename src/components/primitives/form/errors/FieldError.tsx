"use client";

import { ErrorLine } from "@/components/primitives/form/errors/ErrorLine";
import React from "react";
import { FieldError as AriaFieldError } from "react-aria-components";
import "./index.scss";

type BaseProps = React.ComponentProps<typeof AriaFieldError>;
type WithoutChildren = Omit<BaseProps, "children">;

export type FieldErrorProps = WithoutChildren & {
  errorMessage?: React.ReactNode;
  icon?: React.ReactNode | null;
  errorClassName?: string;
};

export const FieldError = React.forwardRef<HTMLDivElement, FieldErrorProps>(
  ({ errorMessage, icon, errorClassName, ...props }, ref) => {
    return (
      <AriaFieldError ref={ref} {...props}>
        {(aria) => (
          <ErrorLine
            message={errorMessage ?? aria?.validationErrors?.[0]}
            icon={icon}
            className={errorClassName}
          />
        )}
      </AriaFieldError>
    );
  },
);

FieldError.displayName = "FieldError";
