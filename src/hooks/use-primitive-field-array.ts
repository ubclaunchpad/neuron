import {
  useController,
  useFormContext,
  useWatch,
  type ArrayPath,
  type BrowserNativeObject,
  type Control,
  type FieldPath,
  type FieldValues,
  type IsAny,
  type IsEqual,
  type Path,
  type Primitive
} from "react-hook-form";

/* Helpers taken from react-hook-form source */
export type TupleKeys<T extends ReadonlyArray<any>> = Exclude<keyof T, keyof any[]>;
export type IsTuple<T extends ReadonlyArray<any>> = number extends T["length"] ? false : true;
export type ArrayKey = number;

/**
 * Helper: break apart T1 and check if any are equal to T2.
 * See {@link IsEqual}
 */
type AnyIsEqual<T1, T2> = T1 extends T2 ? (IsEqual<T1, T2> extends true ? true : never) : never;

/**
 * Internal primitive-array path builder.
 * Includes keys whose values are arrays of Primitive | BrowserNativeObject (`${K}`),
 * recurses through objects (and arrays of objects) to find nested primitive arrays,
 * and guards against cycles.
 */
type PrimitiveArrayPathImpl<K extends string | number, V, TraversedTypes> =
  // leaf primitives/native objects are not arrays → not a primitive-array path
  V extends Primitive | BrowserNativeObject
    ? IsAny<V> extends true
      ? string
      : never
    : V extends ReadonlyArray<infer U>
      ? U extends Primitive | BrowserNativeObject
        // arrays of primitives/native objects -> include this key itself
        ? IsAny<V> extends true
          ? string
          : `${K}`
        : true extends AnyIsEqual<TraversedTypes, V>
          ? never
          // arrays of objects -> look inside the element type (no `${K}` here)
          : `${K}.${PrimitiveArrayPathInternal<V, TraversedTypes | V>}`
      : true extends AnyIsEqual<TraversedTypes, V>
        ? never
        // normal object -> recurse into properties
        : `${K}.${PrimitiveArrayPathInternal<V, TraversedTypes | V>}`;

/**
 * Internal helper that hides TraversedTypes.
 */
type PrimitiveArrayPathInternal<T, TraversedTypes = T> =
  T extends ReadonlyArray<infer V>
    ? IsTuple<T> extends true
      ? {
          [K in TupleKeys<T>]-?: PrimitiveArrayPathImpl<K & string, T[K], TraversedTypes>;
        }[TupleKeys<T>]
      : PrimitiveArrayPathImpl<ArrayKey, V, TraversedTypes>
    : {
        [K in keyof T]-?: PrimitiveArrayPathImpl<K & string, T[K], TraversedTypes>;
      }[keyof T];

/**
 * All paths through T whose values are arrays of Primitive | BrowserNativeObject,
 * or nested inside arrays/objects thereof.
 */
export type PrimitiveArrayPath<T> = T extends any ? PrimitiveArrayPathInternal<T> : never;

/** Convenience alias for form values */
export type PrimitiveFieldArrayPath<TFieldValues extends FieldValues> =
  PrimitiveArrayPath<TFieldValues>;

/**
 * General "get value at path" that also understands our primitive-array paths.
 */
export type PathValue<T, P extends Path<T> | ArrayPath<T> | PrimitiveArrayPath<T>> = PathValueImpl<T, P>;
type PathValueImpl<T, P extends string> =
  T extends any
    ? P extends `${infer K}.${infer R}`
      ? K extends keyof T
        ? PathValueImpl<T[K], R>
        : K extends `${ArrayKey}`
          ? T extends ReadonlyArray<infer V>
            ? PathValueImpl<V, R>
            : never
          : never
      : P extends keyof T
        ? T[P]
        : P extends `${ArrayKey}`
          ? T extends ReadonlyArray<infer V>
            ? V
            : never
          : never
    : never;

/** RHF-style helpers on top of our PathValue */
export type FieldPathValue<TFieldValues extends FieldValues, TFieldPath extends FieldPath<TFieldValues>> =
  PathValue<TFieldValues, TFieldPath>;

export type PrimitiveFieldArrayPathValue<
  TFieldValues extends FieldValues,
  TPrimitiveFieldArrayPath extends PrimitiveFieldArrayPath<TFieldValues>
> = PathValue<TFieldValues, TPrimitiveFieldArrayPath>;

/** Collect values by multiple paths */
export type FieldPathValues<
  TFieldValues extends FieldValues,
  TPath extends FieldPath<TFieldValues>[] | readonly FieldPath<TFieldValues>[]
> = {} & {
  [K in keyof TPath]: FieldPathValue<TFieldValues, TPath[K] & FieldPath<TFieldValues>>;
};

/** Filter field paths by value type */
export type FieldPathByValue<TFieldValues extends FieldValues, TValue> = {
  [Key in FieldPath<TFieldValues>]: FieldPathValue<TFieldValues, Key> extends TValue ? Key : never;
}[FieldPath<TFieldValues>];

/** Filter primitive-array paths by array type */
export type PrimitiveFieldArrayPathByValue<TFieldValues extends FieldValues, TValue> = {
  [Key in PrimitiveFieldArrayPath<TFieldValues>]:
    PrimitiveFieldArrayPathValue<TFieldValues, Key> extends TValue ? Key : never;
}[PrimitiveFieldArrayPath<TFieldValues>];

/** Element type for a primitive array at a given primitive-array path */
export type PrimitiveFieldArray<
  TFieldValues extends FieldValues = FieldValues,
  TPrimitiveFieldArrayName extends PrimitiveFieldArrayPath<TFieldValues> = PrimitiveFieldArrayPath<TFieldValues>,
> =
  PrimitiveFieldArrayPathValue<TFieldValues, TPrimitiveFieldArrayName> extends
    | ReadonlyArray<infer U>
    | null
    | undefined
      ? U
      : never;

function setOptions() {
  return { shouldDirty: true, shouldTouch: true, shouldValidate: true } as const;
}

/**
 * usePrimitiveFieldArray
 * - Mirrors most of useFieldArray’s mutators but for primitive arrays (e.g., string[]).
 * - Keys by index (no id), since items are primitives.
 */
export function usePrimitiveFieldArray<
  TFieldValues extends FieldValues,
  // Make sure "name" is both a PrimitiveArrayPath and a valid RHF FieldPath
  TName extends PrimitiveFieldArrayPath<TFieldValues> & FieldPath<TFieldValues>
>(params: {
  name: TName;
  control?: Control<TFieldValues>;
}) {
  const { name } = params;
  const form = useFormContext<TFieldValues>();
  const control = params.control ?? form.control;
  const { field, fieldState } = useController(params);

  type TValueAtPath = PrimitiveFieldArrayPathValue<TFieldValues, TName>; // e.g., string[] | undefined
  type TItem = PrimitiveFieldArray<TFieldValues, TName>;                 // e.g., string
  type TWritableArr = TItem[];

  const watched = useWatch({ name, control }) as TValueAtPath | undefined;

  const toArray = (v: unknown): TWritableArr =>
    (Array.isArray(v) ? (v as TItem[]) : []) as TWritableArr;

  /** The actual primitive array (e.g., string[]) — key list items by index. */
  const fields: TWritableArr = toArray(watched);

  const set = (next: TWritableArr) =>
    field.onChange(next as unknown as FieldPathValue<TFieldValues, TName>);

  const getCurrent = (): TWritableArr => {
    const cur = field.value as FieldPathValue<TFieldValues, TName> | undefined;
    return toArray(cur);
  };

  const append = (value: TItem | TItem[], _opts?: { shouldFocus?: boolean }) => {
    const cur = getCurrent();
    const add = (Array.isArray(value) ? value : [value]) as TWritableArr;
    set([...cur, ...add]);
  };

  const prepend = (value: TItem | TItem[], _opts?: { shouldFocus?: boolean }) => {
    const cur = getCurrent();
    const add = (Array.isArray(value) ? value : [value]) as TWritableArr;
    set([...add, ...cur]);
  };

  const insert = (index: number, value: TItem | TItem[], _opts?: { shouldFocus?: boolean }) => {
    const cur = getCurrent().slice();
    const add = (Array.isArray(value) ? value : [value]) as TWritableArr;
    cur.splice(index, 0, ...add);
    set(cur);
  };

  const update = (index: number, value: TItem) => {
    const cur = getCurrent().slice();
    cur[index] = value;
    set(cur);
  };

  const remove = (indexOrIndexes?: number | number[]) => {
    const cur = getCurrent().slice();
    if (indexOrIndexes == null) {
      set([]);
      return;
    }
    const idxs = (Array.isArray(indexOrIndexes) ? indexOrIndexes : [indexOrIndexes]).slice();
    idxs
      .sort((a, b) => b - a)
      .forEach((i) => {
        if (i >= 0 && i < cur.length) cur.splice(i, 1);
      });
    set(cur);
  };

  const swap = (a: number, b: number) => {
    if (a === b) return;
    const cur = getCurrent().slice();
    if (a < 0 || b < 0 || a >= cur.length || b >= cur.length) return;
    const tmp = cur[a]!;
    cur[a] = cur[b]!;
    cur[b] = tmp;
    set(cur);
  };

  const move = (from: number, to: number) => {
    if (from === to) return;
    const cur = getCurrent().slice();
    if (from < 0 || from >= cur.length || to < 0 || to >= cur.length) return;
    const [item] = cur.splice(from, 1);
    cur.splice(to, 0, item!);
    set(cur);
  };

  const replace = (values: TWritableArr) => set(values.slice());

  return {
    fields,
    rootFieldState: fieldState,
    append,
    prepend,
    insert,
    remove,
    swap,
    move,
    update,
    replace,
  };
}
