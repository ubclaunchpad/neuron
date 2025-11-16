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

export type Replace<T, TKey extends keyof T, TNew> =
  Omit<T, TKey> & { [K in TKey]: TNew };

export type Subtract<A, B> = Omit<A, keyof B>;

// Utils
type IsPlainObject<T> =
  T extends object ? (T extends Function | any[] ? false : true) : false;

// Make missing keys appear as optional `never` so they union away
type _AllUnionFields<T, K extends PropertyKey = T extends unknown ? keyof T : never> =
  T extends unknown ? T & Partial<Record<Exclude<K, keyof T>, never>> : never;

// Shallow union
export type AllUnionFields<T> = { [K in keyof _AllUnionFields<T>]: _AllUnionFields<T>[K] };

// Deep: recursively apply the trick to nested object unions
export type DeepAllUnionFields<T> =
  IsPlainObject<T> extends true
    ? { [K in keyof _AllUnionFields<T>]:
          DeepAllUnionFields<_AllUnionFields<T>[K]>
      }
    : T;

// (Optional) “shared-only” deep variant
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

type PropOfAll<T, K extends PropertyKey> =
  T extends unknown ? (K extends keyof T ? T[K] : never) : never;

export type DeepSharedUnionFields<T> =
  IsPlainObject<T> extends true
    ? { [K in keyof UnionToIntersection<T>]:
          DeepSharedUnionFields<PropOfAll<T, K>>
      }
    : T;

// (Optional) force required at every level (unsound if some members lack keys)
export type DeepRequired<T> =
  T extends object ? (T extends any[] ? T : { [K in keyof T]-?: DeepRequired<T[K]> }) : T;