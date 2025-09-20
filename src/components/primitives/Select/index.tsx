import CaretDownIcon from "@public/assets/icons/caret-down.svg";
import clsx from "clsx";
import type { ReactNode } from "react";
import {
  Button as AriaButton,
  FieldError as AriaFieldError,
  Label as AriaLabel,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  type ListBoxItemProps as AriaListBoxItemProps,
  Popover as AriaPopover,
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  SelectValue as AriaSelectValue,
  Text as AriaText,
  type ValidationResult as AriaValidationResult
} from "react-aria-components";
import "./index.scss";

export interface SelectProps<T extends object>
  extends Omit<AriaSelectProps<T>, "children"> {
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: string | ((v: AriaValidationResult) => string);
  items?: T[];
  children: React.ReactNode | ((item: T) => React.ReactNode);
  placeholder?: string;
  className?: string;
}

export function Select<T extends object>({
  label,
  description,
  errorMessage,
  items,
  children,
  placeholder = "Select",
  className,
  ...props
}: SelectProps<T>) {
  return (
    <AriaSelect
      {...props}
      aria-label={placeholder || "Select"}
      className={clsx("select", className)}
    >
      {(state) => (
        <>
          {label && (
            <AriaLabel className="select__label" aria-required={state.isRequired || undefined}>
              {label}
            </AriaLabel>
          )}

          <AriaButton className="select__trigger">
            <AriaSelectValue className="select__value">
              {({ isPlaceholder, selectedText }) =>
                isPlaceholder ? (
                  <span className="select__placeholder">{placeholder}</span>
                ) : (
                  <span className="select__selected">{selectedText}</span>
                )
              }
            </AriaSelectValue>

            <span className="select__icon" aria-hidden="true">
              <CaretDownIcon />
            </span>
          </AriaButton>

          {description && (
            <AriaText slot="description" className="select__description">
              {description}
            </AriaText>
          )}
          <AriaFieldError className="select__error">{errorMessage}</AriaFieldError>

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
