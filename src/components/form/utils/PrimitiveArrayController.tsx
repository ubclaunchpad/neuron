import {
  usePrimitiveFieldArray,
  type PrimitiveFieldArrayPath,
} from "@/hooks/use-primitive-field-array";
import React from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

export type PrimitiveFieldArrayApi<
  TFieldValues extends FieldValues,
  TName extends PrimitiveFieldArrayPath<TFieldValues> & FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = ReturnType<
  typeof usePrimitiveFieldArray<TFieldValues, TName, TTransformedValues>
>;

export type PrimitiveArrayControllerRenderProps<
  TFieldValues extends FieldValues,
  TName extends PrimitiveFieldArrayPath<TFieldValues> & FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = PrimitiveFieldArrayApi<TFieldValues, TName, TTransformedValues>;

export interface PrimitiveArrayControllerProps<
  TFieldValues extends FieldValues,
  TName extends PrimitiveFieldArrayPath<TFieldValues> & FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> {
  name: TName;
  control?: Control<TFieldValues, any, TTransformedValues>;
  render: (
    props: PrimitiveArrayControllerRenderProps<
      TFieldValues,
      TName,
      TTransformedValues
    >,
  ) => React.ReactNode;
}

export function PrimitiveArrayController<
  TFieldValues extends FieldValues,
  TName extends PrimitiveFieldArrayPath<TFieldValues> & FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  render,
  ...props
}: PrimitiveArrayControllerProps<TFieldValues, TName, TTransformedValues>) {
  const primitiveFieldArray = usePrimitiveFieldArray<
    TFieldValues,
    TName,
    TTransformedValues
  >(props);
  return <>{render(primitiveFieldArray)}</>;
}
