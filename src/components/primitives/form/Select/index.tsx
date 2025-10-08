"use client";

import { FieldError } from "@/components/primitives/form/errors/FieldError";
import CaretDownIcon from "@public/assets/icons/caret-down.svg";
import clsx from "clsx";
import * as React from "react";
import {
  Button as AriaButton,
  Label as AriaLabel,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  type ListBoxItemProps as AriaListBoxItemProps,
  type ListBoxProps as AriaListBoxProps,
  Popover as AriaPopover,
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  SelectValue as AriaSelectValue,
  Text as AriaText,
  type Key,
} from "react-aria-components";
import { type Control, type FieldPath, type FieldValues, useController } from "react-hook-form";
import "../index.scss";
import "./index.scss";

type Variant = "button" | "field";

type SelectControlProps<TItem extends object> = Pick<
  AriaSelectProps<TItem>,
  "name" | "selectedKey" | "defaultSelectedKey" | "onSelectionChange" | "onBlur" | "isDisabled" | "isRequired"
>;

type AutoControlProps<TFieldValues extends FieldValues> =
  | { control: Control<TFieldValues>; name: FieldPath<TFieldValues> }
  | { control?: undefined; name?: string };

export type SelectProps<
  TItem extends object,
  TFieldValues extends FieldValues = FieldValues
> = Omit<AriaSelectProps<TItem>, "children" | keyof SelectControlProps<TItem>> &
  SelectControlProps<TItem> &
  AutoControlProps<TFieldValues> & {
    label?: React.ReactNode;
    inlineLabel?: boolean;
    description?: React.ReactNode;
    inlineDescription?: boolean;
    errorMessage?: React.ReactNode;
    items?: TItem[];
    children: React.ReactNode | ((item: TItem) => React.ReactNode);
    placeholder?: string;
    className?: string;
    isLoading?: boolean;
    variant?: Variant;
    overridePopoverContent?: boolean;
  };

export const SelectImpl = React.forwardRef<HTMLButtonElement, SelectProps<object, FieldValues>>(
  (
    {
      // controlled props
      name,
      selectedKey,
      defaultSelectedKey,
      onSelectionChange,
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
      items,
      children,
      placeholder = "Select",
      className,
      isLoading,
      variant = "button",
      overridePopoverContent,
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
          selectedKey: (ctrl.field.value ?? null) as Key | null,
          onSelectionChange: (key: Key | null) => ctrl.field.onChange(key == null ? null : String(key)),
          onBlur: ctrl.field.onBlur,
          isDisabled: ctrl.field.disabled,
        }
      : { name, selectedKey: (selectedKey ?? null) as Key | null, onSelectionChange, onBlur, isDisabled, isRequired };

    const triggerRef = ctrl ? (ctrl.field.ref as unknown as React.Ref<HTMLButtonElement>) : ref;
    const computedError = errorMessage ?? ctrl?.fieldState.error?.message;
    const isInvalid = !!computedError;
    const isField = variant === "field";

    return (
      <AriaSelect
        {...props}
        {...controlFieldProps}
        defaultSelectedKey={ctrl ? undefined : defaultSelectedKey}
        isInvalid={isInvalid}
        aria-label={placeholder || "Select"}
        className={clsx("form-input select", { select__field: isField === false }, className)}
        data-variant={variant}
      >
        {(state) => (
          <>
            <div className={clsx("form-input__group", { "form-input__group-inline": inlineLabel })}>
              {label && (
                <AriaLabel className="form-input__label" aria-required={state.isRequired || undefined}>
                  {label}
                </AriaLabel>
              )}

              <AriaButton className="form-input__input-container" slot="trigger" ref={triggerRef}>
                <AriaSelectValue className="form-input__input has-trailing-icon">
                  {({ isPlaceholder, selectedText }) =>
                    isPlaceholder ? placeholder : selectedText
                  }
                </AriaSelectValue>

                <span className="form-input__trailing-icon" aria-hidden="true">
                  <CaretDownIcon />
                </span>
              </AriaButton>
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

            <AriaPopover className="select__popover">
              { overridePopoverContent 
                ? children 
                : <AriaListBox className="select__listbox" items={items}>
                  {children as any}
                </AriaListBox>
              }
            </AriaPopover>
          </>
        )}
      </AriaSelect>
    );
  },
);

SelectImpl.displayName = "Select";

export const Select = Object.assign(
  SelectImpl as <
    TItem extends object,
    TFieldValues extends FieldValues = FieldValues
  >(
    props: SelectProps<TItem, TFieldValues> & { ref?: React.Ref<HTMLButtonElement> }
  ) => React.JSX.Element,
  { ItemList: (props: AriaListBoxProps<any>) => 
    <AriaListBox className={clsx("select__listbox", props.className)} {...props} /> },
  { Item: (props: AriaListBoxItemProps) => <AriaListBoxItem {...props} /> }
);