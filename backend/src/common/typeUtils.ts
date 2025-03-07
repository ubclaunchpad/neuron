export function createStringEnum<const T extends readonly string[]>(values: T) {
  const record = Object.fromEntries(
    values.map(v => [v, v])
  ) as { [K in T[number]]: K };

  return Object.assign(record, { values });
}
