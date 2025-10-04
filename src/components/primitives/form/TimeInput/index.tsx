"use client";

import type { Time } from "@internationalized/date";
import clsx from "clsx";
import * as React from "react";
import {
    DateInput as AriaDateInput,
    DateSegment as AriaDateSegment,
    Group as AriaGroup,
    Label as AriaLabel,
    Text as AriaText,
    TimeField as AriaTimeField,
    type TimeFieldProps as AriaTimeFieldProps
} from "react-aria-components";
import "../form.scss";

import { FieldError } from "@/components/primitives/form/errors/FieldError";

type FieldProps = Omit<AriaTimeFieldProps<Time>, "children">;

export interface TimeInputProps extends Omit<FieldProps, "children"> {
  label?: React.ReactNode;
  inlineLabel?: boolean;
  description?: React.ReactNode;
  inlineDescription?: boolean;
  errorMessage?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}

export function TimeInput({
  label,
  inlineLabel,
  description,
  inlineDescription,
  errorMessage,
  className,
  inputClassName,
  isInvalid: propIsInvalid,
  ...props
}: TimeInputProps) {
  const isInvalid = propIsInvalid ?? !!errorMessage;

  return (
    <AriaTimeField
      {...props}
      isInvalid={isInvalid}
      aria-label={(!label && "Time") || undefined}
      className={clsx("form-input time-input", className)}
    >
      {() => (
        <>
          <div
            className={clsx("form-input__group", {
              "form-input__group-inline": inlineLabel,
            })}
          >
            {label && (
              <AriaLabel className="form-input__label">
                {label}
              </AriaLabel>
            )}

            <AriaGroup className={clsx("form-input__input-container", inputClassName)} role="presentation">
              <AriaDateInput
                className="form-input__input"
                aria-label={(typeof label === "string" && label) || "Time"}
              >
                {(segment) => (
                  <AriaDateSegment
                    segment={segment}
                    className="datepicker__segment"
                  />
                )}
              </AriaDateInput>
            </AriaGroup>
          </div>

          {!inlineDescription && description && (
            <AriaText className="form-input__description" slot="description">
              {description}
            </AriaText>
          )}

          {(errorMessage || (inlineDescription && description)) && (
            <div className="form-input__bottom-container">
              <FieldError errorMessage={errorMessage} />
              {inlineDescription && description && (
                <AriaText className="form-input__description" slot="description">
                  {description}
                </AriaText>
              )}
            </div>
          )}
        </>
      )}
    </AriaTimeField>
  );
}
