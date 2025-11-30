import type { VariantProps } from "class-variance-authority";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  type fieldVariants,
} from "../ui/field";
import { LabelRequiredMarker } from "../ui/label";
import { useFormFieldContext } from "./FormField";
import { isReactNodeNullthy } from "@/lib/nullthy";
import type { ComponentProps } from "react";
import { wrapIfNotArray } from "@/utils/arrayUtils";

export interface FormFieldLayoutProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  hideErrors?: boolean;
  orientation?: VariantProps<typeof fieldVariants>["orientation"];
  controlFirst?: boolean;
  children: React.ReactNode;
  className?: string;
}

function FormFieldLayout({
  label,
  description,
  required,
  orientation,
  controlFirst,
  children,
  hideErrors,
  className,
}: FormFieldLayoutProps) {
  const labelElement = label && (
    <FormLabel required={required}>{label}</FormLabel>
  );

  const descriptionElement = description && (
    <FieldDescription>{description}</FieldDescription>
  );

  if (controlFirst) {
    return (
      <FormField orientation={orientation} className={className}>
        {children}
        <FormContent>
          {labelElement}
          {descriptionElement}
          <FormError hideErrors={hideErrors} />
        </FormContent>
      </FormField>
    );
  }

  return (
    <FormField orientation={orientation} className={className}>
      <FormContent>
        {labelElement}
        {descriptionElement}
      </FormContent>
      {children}
      <FormError hideErrors={hideErrors} />
    </FormField>
  );
}

function FormField(props: React.ComponentProps<typeof Field>) {
  const { fieldState } = useFormFieldContext();
  return <Field data-invalid={fieldState.invalid} {...props} />;
}

function FormContent(props: React.ComponentProps<typeof FieldContent>) {
  return !isReactNodeNullthy(props.children) ? (
    <FieldContent {...props} />
  ) : null;
}

function FormLabel({
  children,
  required,
  ...props
}: React.ComponentProps<typeof FieldLabel> & {
  required?: boolean;
}) {
  const { field } = useFormFieldContext();

  return (
    <FieldLabel htmlFor={field.id} {...props}>
      <span>
        {children}
        {required && (
          <>
            {" "}
            <LabelRequiredMarker />
          </>
        )}
      </span>
    </FieldLabel>
  );
}

function FormDescription({ children }: { children: React.ReactNode }) {
  return <FieldDescription>{children}</FieldDescription>;
}

type FieldErrorsType = ComponentProps<typeof FieldError>["errors"];

function FormError({
  hideErrors,
  errors,
}: {
  hideErrors?: boolean;
  errors?: FieldErrorsType;
}) {
  const { fieldState, name } = useFormFieldContext();
  if (
    hideErrors ||
    (!fieldState.invalid && !wrapIfNotArray(errors).filter((e) => !!e).length)
  ) {
    return null;
  }
  return <FieldError errors={errors ?? fieldState.error} />;
}

export {
  FormDescription,
  FormError,
  FormContent,
  FormField,
  FormFieldLayout,
  FormLabel,
};
