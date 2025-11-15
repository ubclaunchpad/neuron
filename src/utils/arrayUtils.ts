export function uniqueDefined<T>(arr: Array<T | null | undefined>): T[] {
  return Array.from(new Set(arr.filter((x): x is T => x != null)));
}

export function wrapIfNotArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function toMap<T>(this: void, array: T[], key: keyof T = 'id' as keyof T): Map<T[keyof T], T> {
  return new Map(array.map((item) => [item[key], item]));
}

export function range(start: number, end: number, step = 1) {
  return Array.from({ length: Math.floor((end - start) / step) }, (v, i) => start + i * step);
}