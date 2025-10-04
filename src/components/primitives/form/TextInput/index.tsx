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
import "../form.scss";

import { FieldError } from "@/components/primitives/form/errors/FieldError";
import HideIcon from "@public/assets/icons/eye-off.svg";
import ShowIcon from "@public/assets/icons/eye.svg";

type FieldProps = Omit<React.ComponentProps<typeof AriaTextField>, "children">;
type LabelProps = React.ComponentProps<typeof AriaLabel>;
type InputProps = Omit<React.ComponentProps<typeof AriaInput>, "children">;

export type TextInputProps = InputProps & {
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

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
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
        className={clsx("form-input", className)}
      >
        <div className={clsx("form-input__group", {"form-input__group-inline": inlineLabel})}>
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
            <AriaInput
              className={clsx("form-input__input", {"has-trailing-icon": type === "password"})}
              ref={ref}
              type={
                type === "password" ? (isPassVisible ? "text" : "password") : type
              }
              {...inputProps}
            />
            {type == "password" && (
              <AriaButton
                className="form-input__trailing-icon"
                slot="end"
                onPress={togglePassVisible}
              >
                {isPassVisible ? <HideIcon /> : <ShowIcon />}
              </AriaButton>
            )}
          </AriaGroup>
        </div>

        {!inlineDescription && description && (
          <AriaText className="form-input__description" slot="description">
            {description}
          </AriaText>
        )}

        { (errorMessage || (inlineDescription && description)) && <div className="form-input__bottom-container">
          <FieldError errorMessage={errorMessage} />

          {inlineDescription && description && (
            <AriaText className="form-input__description" slot="description">
              {description}
            </AriaText>
          )}
        </div> }
      </AriaTextField>
    );
  },
);

TextInput.displayName = "TextInput";
