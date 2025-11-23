import type { z } from "zod";

type EnumRecordFromUnion<V extends string> = { [K in V]: K } & { readonly values: [V, ...V[]] };
type EnumRecordFromTuple<T extends readonly string[]> = { [K in T[number]]: K } & { values: T };
export function createStringEnum<const T extends readonly [string, ...string[]]>(
  values: T,
): EnumRecordFromTuple<T>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createStringEnum<E extends z.ZodEnum<any>>(
  e: E,
): EnumRecordFromUnion<z.infer<E>>;

export function createStringEnum(arg: unknown) {
  const values: readonly string[] = Array.isArray(arg)
    ? arg
    : (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (arg as any).options ??
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      Object.values((arg as any).enum)
    ) as readonly string[];
  const record = Object.fromEntries(values.map((v) => [v, v])) as Record<string, string>;
  return Object.assign(record, { values });
}

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};