"use client"

import { FieldError } from "@/components/primitives/form/errors/FieldError";
import HideIcon from "@public/assets/icons/eye-off.svg";
import ShowIcon from "@public/assets/icons/eye.svg";
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
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import "../index.scss";

type FieldProps = Omit<React.ComponentProps<typeof AriaTextField>, "children">;
type LabelProps = React.ComponentProps<typeof AriaLabel>;
type InputProps = Omit<React.ComponentProps<typeof AriaInput>, "children">;

type TextFieldControlProps = Pick<
  React.ComponentProps<typeof AriaTextField>,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur"
>;

type AutoControlProps<TFieldValues extends FieldValues> =
  | { control: Control<TFieldValues>; name: FieldPath<TFieldValues> }
  | { control?: undefined; name?: string };

export type TextInputProps<TFieldValues extends FieldValues = FieldValues> =
  Omit<InputProps, "name" | "value" | "defaultValue" | "onChange" | "onBlur"> &
  TextFieldControlProps &
  AutoControlProps<TFieldValues> & {
    label?: React.ReactNode;
    inlineLabel?: boolean;
    description?: React.ReactNode;
    inlineDescription?: boolean;
    errorMessage?: React.ReactNode;
    fieldProps?: Omit<FieldProps, "name" | "value" | "defaultValue" | "onChange" | "onBlur">;
    labelProps?: LabelProps;
    className?: string;
    inputClassName?: string;
  };

export const TextInputImpl = React.forwardRef<HTMLInputElement, TextInputProps<FieldValues>>(
  (
    {
      // control props
      name,
      value,
      defaultValue,
      onChange,
      onBlur,

      // react-hook-form control
      control,

      // presentation
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
    const isControlled = React.useRef(!!control).current;
    const ctrl = isControlled
      ? useController({ name: name as FieldPath<FieldValues>, control: control as Control<FieldValues> })
      : null;

    const controlFieldProps = ctrl 
      ? {
        name: ctrl.field.name,
        value: ctrl.field.value ?? "",
        onChange: ctrl.field.onChange,
        onBlur: ctrl.field.onBlur,
        isDisabled: ctrl.field.disabled,
      } : { name, value, onChange, onBlur, }
    const inputRef = ctrl ? ctrl.field.ref : ref;

    const computedError = errorMessage ?? ctrl?.fieldState.error?.message;
    const isInvalid = fieldProps?.isInvalid ?? !!computedError;

    const [isPassVisible, setIsPassVisible] = React.useState(false);

    return (
      <AriaTextField
        {...controlFieldProps}
        {...fieldProps}
        isInvalid={isInvalid}
        className={clsx("form-input", className)}
      >
        <div className={clsx("form-input__group", { "form-input__group-inline": inlineLabel })}>
          {label && (
            <AriaLabel className={clsx("form-input__label", labelProps?.className)} {...labelProps}>
              {label}
            </AriaLabel>
          )}

          <AriaGroup className={clsx("form-input__input-container", inputClassName)} role="presentation">
            <AriaInput
              className={clsx("form-input__input", { "has-trailing-icon": type === "password" })}
              ref={inputRef}
              type={type === "password" ? (isPassVisible ? "text" : "password") : type}
              {...inputProps}
            />
            {type === "password" && (
              <AriaButton className="form-input__trailing-icon" slot="end" onPress={() => setIsPassVisible(v => !v)}>
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

        {(computedError || (inlineDescription && description)) && (
          <div className="form-input__bottom-container">
            <FieldError errorMessage={computedError} />
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

TextInputImpl.displayName = "TextInput";

export const TextInput = TextInputImpl as <
  TFieldValues extends FieldValues = FieldValues
>(
  props: TextInputProps<TFieldValues> & { ref?: React.Ref<HTMLDivElement> }
) => React.JSX.Element;