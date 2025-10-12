"use client";

import { FieldError } from "@/components/form/errors/FieldError";
import clsx from "clsx";
import * as React from "react";
import {
  Group as AriaGroup,
  Label as AriaLabel,
  Text as AriaText,
  TextArea as AriaTextArea,
  TextField as AriaTextField,
} from "react-aria-components";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import "../index.scss";
import "./index.scss";

type FieldProps = Omit<React.ComponentProps<typeof AriaTextField>, "children">;
type LabelProps = React.ComponentProps<typeof AriaLabel>;
type AriaTextAreaProps = Omit<React.ComponentProps<typeof AriaTextArea>, "children">;

type TextFieldControlProps = Pick<
  React.ComponentProps<typeof AriaTextField>,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur"
>;

type AutoControlProps<TFieldValues extends FieldValues> =
  | { control: Control<TFieldValues>; name: FieldPath<TFieldValues> }
  | { control?: undefined; name?: string };

export type TextAreaProps<TFieldValues extends FieldValues = FieldValues> =
  AriaTextAreaProps &
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

export const TextAreaImpl = React.forwardRef<HTMLTextAreaElement, TextAreaProps<FieldValues>>(
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
      rows = 4,
      ...textAreaProps
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
        }
      : { name, value, onChange, onBlur };

    const inputRef = ctrl ? (ctrl.field.ref as unknown as React.Ref<HTMLTextAreaElement>) : ref;
    const computedError = errorMessage ?? ctrl?.fieldState.error?.message;
    const isInvalid = fieldProps?.isInvalid ?? !!computedError;

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
            <AriaTextArea
              ref={inputRef}
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

TextAreaImpl.displayName = "TextArea";

export const TextArea = TextAreaImpl as <
  TFieldValues extends FieldValues = FieldValues
>(
  props: TextAreaProps<TFieldValues> & { ref?: React.Ref<HTMLDivElement> }
) => React.JSX.Element;