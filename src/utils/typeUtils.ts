import { type z } from "zod";

type EnumTuple<E> = E extends z.ZodEnum<infer T> ? T : never;
type EnumRecord<T extends [string, ...string[]], E extends z.ZodEnum<T>> = {
  [K in EnumTuple<E>[number]]: K;
} & { values: EnumTuple<E> };

export function createStringEnum<T extends [string, ...string[]], const E extends z.ZodEnum<T>>(
  e: E,
): EnumRecord<T, E> {
  const values = e.options as EnumTuple<E>;
  const record = Object.fromEntries(values.map((v: string) => [v, v])) as {
    [K in EnumTuple<E>[number]]: K;
  };
  return Object.assign(record, { values }) as EnumRecord<T, E>;
}
