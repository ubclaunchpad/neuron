import * as React from "react";
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

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

type FormFieldContextValue = {
  control: ControllerProps<any, any>["control"];
  name: FieldPath<any>;
  field: FormFieldProp<any, any>;
  fieldState: ControllerFieldState;
};

const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(
  undefined,
);

export function useFormFieldContext() {
  const ctx = React.useContext(FormFieldContext);
  if (!ctx) {
    throw new Error("useFormField must be used within a <FormField>.");
  }
  return ctx;
}

// Core field wrapper handles Controller and context
export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> {
  name: TName;
  control: Control<TFieldValues, any, TTransformedValues>;
  children: React.ReactNode | ((
    field: FormFieldProp<TFieldValues, TName, TTransformedValues>,
  ) => React.ReactNode);
}

export function FormFieldController<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  children,
  control,
  name,
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

        return (
          <FormFieldContext.Provider
            value={{
              control,
              name,
              field: fieldWithMeta,
              fieldState,
            }}
          >
            {typeof children === "function" ? children(fieldWithMeta) : children}
          </FormFieldContext.Provider>
        );
      }}
    />
  );
}
