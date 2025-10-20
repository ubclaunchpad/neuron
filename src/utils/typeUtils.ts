import { z } from "zod";

type EnumRecordFromUnion<V extends string> = { [K in V]: K } & { readonly values: [V, ...V[]] };
type EnumRecordFromTuple<T extends readonly string[]> = { [K in T[number]]: K } & { values: T };
export function createStringEnum<const T extends readonly [string, ...string[]]>(
  values: T,
): EnumRecordFromTuple<T>;
export function createStringEnum<E extends z.ZodEnum<any>>(
  e: E,
): EnumRecordFromUnion<z.infer<E>>;

export function createStringEnum(arg: unknown) {
  const values: readonly string[] = Array.isArray(arg)
    ? arg
    : ((arg as any).options ?? Object.values((arg as any).enum)) as readonly string[];
  const record = Object.fromEntries(values.map((v) => [v, v])) as Record<string, string>;
  return Object.assign(record, { values });
}

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};