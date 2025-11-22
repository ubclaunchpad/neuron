import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import {
  Controller,
  type ControllerFieldState,
  type ControllerProps,
  type FieldPath,
  type FieldPathByValue,
  type FieldValues,
} from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  type fieldVariants,
} from "../primitives/field";
import { LabelRequiredMarker } from "../primitives/label";

export type FormControlProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = {
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  control: ControllerProps<TFieldValues, TName, TTransformedValues>["control"];
  orientation?: VariantProps<typeof fieldVariants>["orientation"];
  required?: boolean;
  hideErrors?: boolean;
};

export type FormFieldProp<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = Parameters<
  ControllerProps<TFieldValues, TName, TTransformedValues>["render"]
>[0]["field"] & {
  "aria-invalid": boolean;
  id: string;
};

export type FormBaseProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = FormControlProps<TFieldValues, TName, TTransformedValues> & {
  /** For checkbox-style fields where the control comes before the label. */
  controlFirst?: boolean;
  children: (
    field: FormFieldProp<TFieldValues, TName, TTransformedValues>,
  ) => React.ReactNode;
};

export type FormControlFunc<
  ExtraProps extends Record<string, unknown> = Record<never, never>,
> = <
  TFieldValues extends FieldValues = FieldValues,
  TTransformedValues = TFieldValues,
  TName extends FieldPathByValue<TFieldValues, any> = FieldPathByValue<
    TFieldValues,
    any
  >,
>(
  props: FormControlProps<TFieldValues, TName, TTransformedValues> & ExtraProps,
) => React.ReactNode;

type AnyFormFieldContext = {
  field: FormFieldProp<any, any, any>;
  fieldState: ControllerFieldState;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  hideErrors?: boolean;
};

const FormFieldContext = React.createContext<AnyFormFieldContext | undefined>(
  undefined,
);

export function useFormFieldContext() {
  const ctx = React.useContext(FormFieldContext);
  if (!ctx) {
    throw new Error(
      "FormField compound components must be used within a <FormField>.",
    );
  }
  return ctx;
}

export type FormFieldChildren<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> =
  | React.ReactNode
  | ((
      field: FormFieldProp<TFieldValues, TName, TTransformedValues>,
    ) => React.ReactNode);

export type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = FormControlProps<TFieldValues, TName, TTransformedValues> & {
  children?: FormFieldChildren<TFieldValues, TName, TTransformedValues>;
};

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  children,
  control,
  name,
  label,
  description,
  orientation,
  hideErrors,
  required,
}: FormFieldProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const fieldWithMeta: FormFieldProp<
          TFieldValues,
          TName,
          TTransformedValues
        > = {
          ...field,
          id: field.name,
          "aria-invalid": fieldState.invalid,
        };

        const content =
          typeof children === "function" ? children(fieldWithMeta) : children;

        return (
          <FormFieldContext.Provider
            value={{
              field: fieldWithMeta,
              fieldState,
              label,
              description,
              required,
              hideErrors,
            }}
          >
            <Field data-invalid={fieldState.invalid} orientation={orientation}>
              {content}
            </Field>
          </FormFieldContext.Provider>
        );
      }}
    />
  );
}

export function FormErrors() {
  const { fieldState, hideErrors } = useFormFieldContext();
  if (hideErrors || !fieldState.invalid) return null;
  return <FieldError errors={fieldState.error} />;
}

export type FormLabelProps = React.ComponentProps<typeof FieldLabel> & {
  children?: React.ReactNode;
};

export function FormLabel({ children, ...props }: FormLabelProps) {
  const { field, label, description, required } = useFormFieldContext();
  const labelContent = children ?? label;

  return (
    <>
      {labelContent && (
        <FieldLabel htmlFor={field.id} {...props}>
          <span>
            {labelContent}
            {required && (
              <>
                {" "}
                <LabelRequiredMarker />
              </>
            )}
          </span>
        </FieldLabel>
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
    </>
  );
}

export function FormBase<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  children,
  controlFirst,
  ...fieldProps
}: FormBaseProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormField<TFieldValues, TName, TTransformedValues> {...fieldProps}>
      {(field) => {
        const control = children(field);

        if (controlFirst) {
          return (
            <>
              {control}
              <FieldContent>
                <FormLabel />
                <FormErrors />
              </FieldContent>
            </>
          );
        }

        return (
          <>
            <FieldContent>
              <FormLabel />
            </FieldContent>
            {control}
            <FormErrors />
          </>
        );
      }}
    </FormField>
  );
}
