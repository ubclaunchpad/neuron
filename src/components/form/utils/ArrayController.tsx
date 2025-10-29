import {
  useFieldArray,
  type FieldArrayPath,
  type FieldValues,
  type UseFieldArrayProps,
  type UseFieldArrayReturn,
} from "react-hook-form";

export type ArrayControllerRenderProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = "id",
> = UseFieldArrayReturn<TFieldValues, TName, TKeyName>;

export type ArrayControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = "id",
  TTransformedValues = TFieldValues,
> = UseFieldArrayProps<TFieldValues, TName, TKeyName, TTransformedValues> & {
  render: (
    props: ArrayControllerRenderProps<TFieldValues, TName, TKeyName>,
  ) => React.ReactNode;
};

export function ArrayController<
  TFieldValues extends FieldValues,
  TName extends FieldArrayPath<TFieldValues>,
  TKeyName extends string = "id",
  TTransformedValues = TFieldValues,
>({
  render,
  ...props
}: ArrayControllerProps<TFieldValues, TName, TKeyName, TTransformedValues>) {
  const fieldArray = useFieldArray<
    TFieldValues,
    TName,
    TKeyName,
    TTransformedValues
  >(props);
  return <>{render(fieldArray)}</>;
}
