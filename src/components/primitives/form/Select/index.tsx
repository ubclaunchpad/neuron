// Select.tsx
"use client";

import clsx from "clsx";
import {
  Button as AriaButton,
  Label as AriaLabel,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  type ListBoxItemProps as AriaListBoxItemProps,
  Popover as AriaPopover,
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  SelectValue as AriaSelectValue,
  Text as AriaText,
} from "react-aria-components";
import "./index.scss";

import { FieldError } from "@/components/primitives/form/errors/FieldError";
import { SkeletonButton } from "@/components/skeleton";
import CaretDownIcon from "@public/assets/icons/caret-down.svg";

type Variant = "button" | "field";

export interface SelectProps<T extends object>
  extends Omit<AriaSelectProps<T>, "children"> {
  label?: React.ReactNode;
  inlineLabel?: boolean;
  description?: React.ReactNode;
  inlineDescription?: boolean;
  errorMessage?: React.ReactNode;
  items?: T[];
  children: React.ReactNode | ((item: T) => React.ReactNode);
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  variant?: Variant;
}

export function Select<T extends object>({
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
  ...props
}: SelectProps<T>) {
  if (isLoading) return <SkeletonButton />;

  const isField = variant === "field";

  return (
    <AriaSelect
      {...props}
      aria-label={placeholder || "Select"}
      className={clsx("form-input select", {"select__field": !isField}, className)}
      data-variant={variant}
    >
      {(state) => (
        <>
          <div className={clsx("form-input__group", {"form-input__group-inline": inlineLabel})}>
            {label && (
              <AriaLabel
                className={"form-input__label"}
                aria-required={state.isRequired || undefined}
              >
                {label}
              </AriaLabel>
            )}

            <AriaButton className="form-input__input-container" slot="trigger">
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

        { (errorMessage || (inlineDescription && description)) && <div className="form-input__bottom-container">
          <FieldError errorMessage={errorMessage} />

          {inlineDescription && description && (
            <AriaText className="form-input__description" slot="description">
              {description}
            </AriaText>
          )}
        </div> }

          <AriaPopover className="select__popover">
            <AriaListBox className="select__listbox" items={items}>
              {children}
            </AriaListBox>
          </AriaPopover>
        </>
      )}
    </AriaSelect>
  );
}

Select.Item = function Item(props: AriaListBoxItemProps) {
  return <AriaListBoxItem {...props} />;
};
