"use client";

import clsx from "clsx";
import * as React from "react";
import {
  Button as AriaButton,
  Group as AriaGroup,
  Input as AriaInput,
  Label as AriaLabel,
  Text as AriaText,
  TextField as AriaTextField,
} from "react-aria-components";
import "./index.scss";

import { FieldError } from "@/components/primitives/FormErrors/FieldError";
import HideIcon from "@public/assets/icons/eye-off.svg";
import ShowIcon from "@public/assets/icons/eye.svg";

type FieldProps = Omit<React.ComponentProps<typeof AriaTextField>, "children">;
type LabelProps = React.ComponentProps<typeof AriaLabel>;
type InputProps = Omit<React.ComponentProps<typeof AriaInput>, "children">;

export type TextInputProps = InputProps & {
  label: React.ReactNode;
  description?: React.ReactNode;
  inlineDescription?: boolean;
  errorMessage?: React.ReactNode;
  fieldProps?: FieldProps;
  labelProps?: LabelProps;
  className?: string;
  inputClassName?: string;
};

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      description,
      inlineDescription,
      errorMessage,
      fieldProps,
      labelProps,
      className,
      inputClassName,
      type,
      ...inputProps
    },
    ref,
  ) => {
    const [isPassVisible, setIsPassVisible] = React.useState(false);
    const togglePassVisible = () => setIsPassVisible(!isPassVisible);
    const isInvalid = fieldProps?.isInvalid ?? !!errorMessage;

    return (
      <AriaTextField
        {...fieldProps}
        isInvalid={isInvalid}
        className={clsx("text-input", className)}
      >
        {label && (
          <AriaLabel
            className={clsx("text-input__label", labelProps?.className)}
            {...labelProps}
          >
            {label}
          </AriaLabel>
        )}

        <AriaGroup
          className={clsx("text-input__group", inputClassName)}
          role="presentation"
        >
          <AriaInput
            className="text-input__input"
            ref={ref}
            type={
              type === "password" ? (isPassVisible ? "text" : "password") : type
            }
            {...inputProps}
          />
          {type == "password" && (
            <AriaButton
              className="text-input__toggle"
              slot="end"
              onPress={togglePassVisible}
            >
              {isPassVisible ? <HideIcon /> : <ShowIcon />}
            </AriaButton>
          )}
        </AriaGroup>

        {!inlineDescription && description && (
          <AriaText className="text-input__description" slot="description">
            {description}
          </AriaText>
        )}

        <div className="text-input__bottom-container">
          <FieldError errorMessage={errorMessage} />

          {inlineDescription && description && (
            <AriaText className="text-input__description" slot="description">
              {description}
            </AriaText>
          )}
        </div>
      </AriaTextField>
    );
  },
);

TextInput.displayName = "TextInput";
