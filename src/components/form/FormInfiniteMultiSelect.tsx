import type { ComponentProps } from "react";
import type {
  FieldPath,
  FieldValues,
  FieldArrayPath,
  Control,
  FieldArrayWithId,
} from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import { FormFieldController, useFormFieldContext } from "./FormField";
import { FormFieldLayout } from "./FormLayout";
import {
  type SelectEntity,
  InfiniteMultiSelect,
} from "../primitives/infinite-multiselect";

export interface FormInfiniteMultiSelectProps<
  TEntity extends SelectEntity,
  TQueryData extends { entities: TEntity[] },
> extends Omit<
    React.ComponentProps<typeof InfiniteMultiSelect<TEntity, TQueryData>>,
    "values" | "onAppend" | "onRemove"
  > {}

function FormInfiniteMultiSelect<
  TEntity extends SelectEntity,
  TQueryData extends { entities: TEntity[] },
>({ ...props }: FormInfiniteMultiSelectProps<TEntity, TQueryData>) {
  const { control, name } = useFormFieldContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
    keyName: "key",
  });

  return (
    <InfiniteMultiSelect
      values={fields as unknown as TEntity[]}
      onAppend={append}
      onRemove={remove}
      {...props}
    />
  );
}

export interface FormInfiniteMultiSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TEntity extends SelectEntity = SelectEntity,
  TName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TQueryData extends { entities: TEntity[] } = { entities: TEntity[] },
  TTransformedValues = TFieldValues,
> extends Omit<
    ComponentProps<typeof InfiniteMultiSelect<TEntity, TQueryData>>,
    "values" | "onAppend" | "onRemove"
  > {
  name: TName;
  control: Control<TFieldValues, any, TTransformedValues>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  hideErrors?: boolean;
  className?: string;
  useInfiniteQuery: (search: string) => UseInfiniteQueryResult<TQueryData, any>;
}

function FormInfiniteMultiSelectField<
  TFieldValues extends FieldValues = FieldValues,
  TEntity extends SelectEntity = SelectEntity,
  TName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TQueryData extends { entities: TEntity[] } = { entities: TEntity[] },
  TTransformedValues = TFieldValues,
>({
  name,
  control,
  label,
  description,
  required,
  hideErrors,
  className,
  useInfiniteQuery,
  ...selectProps
}: FormInfiniteMultiSelectFieldProps<
  TFieldValues,
  TEntity,
  TName,
  TQueryData,
  TTransformedValues
>) {
  return (
    <FormFieldController
      name={name as FieldPath<TFieldValues>}
      control={control}
    >
      {({ value, onChange, ...field }) => (
        <FormFieldLayout
          label={label}
          description={description}
          required={required}
          hideErrors={hideErrors}
          className={className}
        >
          <FormInfiniteMultiSelect
            useInfiniteQuery={useInfiniteQuery}
            {...selectProps}
            {...field}
          />
        </FormFieldLayout>
      )}
    </FormFieldController>
  );
}

export { FormInfiniteMultiSelect, FormInfiniteMultiSelectField };
