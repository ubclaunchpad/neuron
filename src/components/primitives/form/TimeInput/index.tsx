"use client";

import { FieldError } from "@/components/primitives/form/errors/FieldError";
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
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import "../index.scss";

type FieldProps = Omit<AriaTimeFieldProps<Time>, "children">;

type TimeFieldControlProps = Pick<
  AriaTimeFieldProps<Time>,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "isDisabled" | "isRequired"
>;

type AutoControlProps<TFieldValues extends FieldValues> =
  | { control: Control<TFieldValues>; name: FieldPath<TFieldValues> }
  | { control?: undefined; name?: string };

export type TimeInputProps<TFieldValues extends FieldValues = FieldValues> =
  Omit<AriaTimeFieldProps<Time>, "children" | keyof TimeFieldControlProps> &
  TimeFieldControlProps &
  AutoControlProps<TFieldValues> & {
    label?: React.ReactNode;
    inlineLabel?: boolean;
    description?: React.ReactNode;
    inlineDescription?: boolean;
    errorMessage?: React.ReactNode;
    className?: string;
    inputClassName?: string;
    fieldProps?: Omit<FieldProps, keyof TimeFieldControlProps>;
  };

export const TimeInputImpl = React.forwardRef<HTMLDivElement, TimeInputProps<FieldValues>>(
  (
    {
      // control props
      name,
      value,
      defaultValue,
      onChange,
      onBlur,
      isDisabled,
      isRequired,

      // react-hook-form control
      control,

      // presentation
      label,
      inlineLabel,
      description,
      inlineDescription,
      errorMessage,
      className,
      inputClassName,
      fieldProps,
      ...props
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
          value: ctrl.field.value as Time | undefined,
          onChange: ctrl.field.onChange,
          onBlur: ctrl.field.onBlur,
          isDisabled: ctrl.field.disabled,
        }
      : { name, value, onChange, onBlur, isDisabled, isRequired };

    const focusRef = ctrl ? (ctrl.field.ref as unknown as React.Ref<HTMLDivElement>) : ref;
    const computedError = errorMessage ?? ctrl?.fieldState.error?.message;
    const isInvalid = fieldProps?.isInvalid ?? !!computedError;

    return (
      <AriaTimeField
        {...props}
        {...controlFieldProps}
        defaultValue={ctrl ? undefined : (defaultValue as Time | undefined)}
        isInvalid={isInvalid}
        aria-label={(!label && "Time") || undefined}
        className={clsx("form-input time-input", className)}
      >
        {() => (
          <>
            <div className={clsx("form-input__group", { "form-input__group-inline": inlineLabel })}>
              {label && <AriaLabel className="form-input__label">{label}</AriaLabel>}

              <AriaGroup className={clsx("form-input__input-container", inputClassName)} role="presentation">
                <AriaDateInput ref={focusRef} className="form-input__input" aria-label={(typeof label === "string" && label) || "Time"}>
                  {(segment) => <AriaDateSegment segment={segment} className="datepicker__segment" />}
                </AriaDateInput>
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
          </>
        )}
      </AriaTimeField>
    );
  },
);

TimeInputImpl.displayName = "TimeInput";

export const TimeInput = TimeInputImpl as <
  TFieldValues extends FieldValues = FieldValues
>(
  props: TimeInputProps<TFieldValues> & { ref?: React.Ref<HTMLDivElement> }
) => React.JSX.Element;