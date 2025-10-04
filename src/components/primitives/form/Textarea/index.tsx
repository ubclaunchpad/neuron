"use client";

import clsx from "clsx";
import * as React from "react";
import {
  Group as AriaGroup,
  Label as AriaLabel,
  Text as AriaText,
  TextArea as AriaTextArea,
  TextField as AriaTextField
} from "react-aria-components";
import "../form.scss";
import "./index.scss";

import { FieldError } from "@/components/primitives/form/errors/FieldError";

type FieldProps = Omit<React.ComponentProps<typeof AriaTextField>, "children">;
type LabelProps = React.ComponentProps<typeof AriaLabel>;
type AriaTextAreaProps = Omit<
  React.ComponentProps<typeof AriaTextArea>,
  "children"
>;

export type TextAreaProps = AriaTextAreaProps & {
  label: React.ReactNode;
  inlineLabel?: boolean;
  description?: React.ReactNode;
  inlineDescription?: boolean;
  errorMessage?: React.ReactNode;
  fieldProps?: FieldProps;
  labelProps?: LabelProps;
  className?: string;
  inputClassName?: string;
};

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      inlineLabel,
      description,
      inlineDescription,
      errorMessage,
      fieldProps,
      labelProps,
      className,
      inputClassName,
      rows = 4,
      ...textAreaProps
    },
    ref,
  ) => {
    const isInvalid = fieldProps?.isInvalid ?? !!errorMessage;

    return (
      <AriaTextField
        {...fieldProps}
        isInvalid={isInvalid}
        className={clsx("form-input", className)}
      >
        <div
          className={clsx("form-input__group", {
            "form-input__group-inline": inlineLabel,
          })}
        >
          {label && (
            <AriaLabel
              className={clsx("form-input__label", labelProps?.className)}
              {...labelProps}
            >
              {label}
            </AriaLabel>
          )}

          <AriaGroup
            className={clsx("form-input__input-container", inputClassName)}
            role="presentation"
          >
            <AriaTextArea
              ref={ref}
              rows={rows}
              className="form-input__input form-input__textarea"
              {...textAreaProps}
            />
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
      </AriaTextField>
    );
  },
);

TextArea.displayName = "TextArea";
