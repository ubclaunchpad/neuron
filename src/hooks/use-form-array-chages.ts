import { useRef } from "react";
import {
  useFieldArray,
  useFormContext,
  type Control,
  type FieldArrayPath,
  type FieldValues,
  type PathValue,
  type UseFieldArrayReturn
} from "react-hook-form";

type UseFieldArrayChangesOptions<
  TFieldValues extends FieldValues,
  TName extends FieldArrayPath<TFieldValues>,
  TTransformedValues extends FieldValues = TFieldValues,
  TIdName extends string = "id",
  TKeyName extends string = "key"
> = {
  control?: Control<TFieldValues, any, TTransformedValues>;
  name: TName;
  idName?: TIdName;
  keyName?: TKeyName;
};

type UseFieldArrayChangesReturn<
  TFieldValues extends FieldValues,
  TName extends FieldArrayPath<TFieldValues>,
  TKeyName extends string = "key",
> = UseFieldArrayReturn<TFieldValues, TName, TKeyName> & {
  getChanges: () => {
    // NOTE: these are INPUT rows because RHF getValues() returns input, not transformed
    added: Array<PathValue<TFieldValues, TName>[number]>;
    updated: Array<PathValue<TFieldValues, TName>[number]>;
    deletedIds: Array<string>;
  };
};

export function useFieldArrayChanges<
  TFieldValues extends FieldValues,
  TName extends FieldArrayPath<TFieldValues>,
  TTransformedValues extends FieldValues = TFieldValues,
  TIdName extends string = "id",
  TKeyName extends string = "key",
>(
  opts: UseFieldArrayChangesOptions<
    TFieldValues,
    TName,
    TTransformedValues,
    TIdName,
    TKeyName
  >
): UseFieldArrayChangesReturn<
  TFieldValues,
  TName,
  TKeyName
> {
  const { control: controlProp, name, idName = "id", keyName } = opts;

  const ctx = useFormContext<TFieldValues, any, TTransformedValues>();
  const control = (controlProp ?? ctx.control)!;

  const fieldArray = useFieldArray<
    TFieldValues,
    TName,
    TKeyName,
    TTransformedValues
  >({ control, name, keyName });
  const { fields, remove: removeFieldArray } = fieldArray;

  // Track deleted IDs
  const deletedIdsRef = useRef<Array<string | number>>([]);
  const remove = (index?: number | number[]) => {
    const indexes = typeof index === "number" ? [index] : index;
    indexes?.forEach((idx) => {
      const item = fields.at(idx) as unknown as Record<string, any> | undefined;
      const idVal = item?.[idName as string];
      if (idVal != null && idVal !== "") {
        deletedIdsRef.current.push(idVal);
      }
    });
    removeFieldArray(indexes);
  };

  const getChanges = () => {
    const values = (ctx.getValues(name as any) ?? []) as Array<PathValue<TFieldValues, TName>[number]>;

    const added: Array<PathValue<TFieldValues, TName>[number]> = [];
    const updated: Array<PathValue<TFieldValues, TName>[number]> = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i] as Record<string, any>;
      const hasId = row?.[idName as string] != null && row[idName as string] !== "";

      if (!hasId) {
        added.push(values[i]);
      } else {
        const isDirty = ctx.getFieldState(`${name}.${i}` as any).isDirty;
        if (isDirty) {
          updated.push(values[i]);
        }
      }
    }

    const deletedIds = deletedIdsRef.current.map((x) => String(x));
    return { added, updated, deletedIds };
  };

  return {
    ...fieldArray,
    remove,
    getChanges,
  };
}