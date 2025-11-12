import {
  usePrimitiveFieldArray,
  type PrimitiveFieldArrayPath
} from "@/hooks/use-primitive-field-array";
import React from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

export type PrimitiveFieldArrayApi<
  TFieldValues extends FieldValues,
  TName extends PrimitiveFieldArrayPath<TFieldValues> & FieldPath<TFieldValues>
> = ReturnType<typeof usePrimitiveFieldArray<TFieldValues, TName>>;

export type PrimitiveArrayControllerRenderProps<
  TFieldValues extends FieldValues,
  TName extends PrimitiveFieldArrayPath<TFieldValues> & FieldPath<TFieldValues>
> = PrimitiveFieldArrayApi<TFieldValues, TName>;

export interface PrimitiveArrayControllerProps<
  TFieldValues extends FieldValues,
  TName extends PrimitiveFieldArrayPath<TFieldValues> & FieldPath<TFieldValues>
> {
  name: TName;
  control?: Control<TFieldValues>;
  render: (props: PrimitiveArrayControllerRenderProps<TFieldValues, TName>) => React.ReactNode;
}

export function PrimitiveArrayController<
  TFieldValues extends FieldValues,
  TName extends PrimitiveFieldArrayPath<TFieldValues> & FieldPath<TFieldValues>
>({
  render,
  ...props
}: PrimitiveArrayControllerProps<TFieldValues, TName>) {
  const primitiveFieldArray = usePrimitiveFieldArray<TFieldValues, TName>(props);
  return <>{render(primitiveFieldArray)}</>;
}
