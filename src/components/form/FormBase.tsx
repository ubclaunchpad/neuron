import type { VariantProps } from "class-variance-authority";
import {
  Controller,
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

export function FormBase<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  children,
  control,
  label,
  name,
  description,
  controlFirst,
  orientation,
  hideErrors,
  required,
}: FormBaseProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const labelElement = (
          <>
            {label && (
              <FieldLabel htmlFor={field.name}>
                {label}
                {required && (
                  <>
                    {" "}
                    <LabelRequiredMarker />
                  </>
                )}
              </FieldLabel>
            )}
            {description && <FieldDescription>{description}</FieldDescription>}
          </>
        );
        const control = children({
          ...field,
          id: field.name,
          "aria-invalid": fieldState.invalid,
        });
        const errorElem = fieldState.invalid && !hideErrors && (
          <FieldError errors={fieldState.error} />
        );

        return (
          <Field data-invalid={fieldState.invalid} orientation={orientation}>
            {controlFirst ? (
              <>
                {control}
                {(label || errorElem) ?? (
                  <FieldContent>
                    {labelElement}
                    {errorElem}
                  </FieldContent>
                )}
              </>
            ) : (
              <>
                {label && <FieldContent>{labelElement}</FieldContent>}
                {control}
                {errorElem}
              </>
            )}
          </Field>
        );
      }}
    />
  );
}
