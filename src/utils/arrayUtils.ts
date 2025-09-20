export function wrapIfNotArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function toMap<T>(this: void, array: T[], key: keyof T = 'id' as keyof T): Map<T[keyof T], T> {
  return new Map(array.map((item) => [item[key], item]));
}