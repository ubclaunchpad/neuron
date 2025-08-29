import { z } from "zod";

type EnumTuple<E> = E extends z.ZodEnum<infer T> ? T : never;
type EnumRecord<E extends z.ZodEnum<any>> = {
  [K in EnumTuple<E>[number]]: K;
} & { values: EnumTuple<E> };

export function createStringEnum<const E extends z.ZodEnum<any>>(e: E): EnumRecord<E> {
  const values = e.options as EnumTuple<E>;
  const record = Object.fromEntries(values.map((v: string) => [v, v])) as {
    [K in EnumTuple<E>[number]]: K;
  };
  return Object.assign(record, { values }) as EnumRecord<E>;
}