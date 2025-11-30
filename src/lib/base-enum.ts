export type SelectEntity = {
  id: string;
  label: string;
};

export class StringEnum<T extends string> {
  protected translateKeys: Record<T, string>;

  private constructor(translateKeys: any) {
    this.translateKeys = translateKeys;
  }

  static createFromType<
    TEnum extends string,
    TMap extends Record<TEnum, string> = Record<TEnum, string>,
  >(
    keys: TMap,
  ): StringEnum<TEnum> & { [K in keyof TMap]: K } & {
    values: [TEnum, ...TEnum[]];
  } {
    const baseEnum = new StringEnum<TEnum>(keys);

    // augment with key = "key" fields
    const result = baseEnum as StringEnum<TEnum> & { [K in keyof TMap]: K } & {
      values: [TEnum, ...TEnum[]];
    };

    (result as any).values = Object.keys(keys);
    for (const key in keys) {
      (result as any)[key] = key;
    }

    return result;
  }

  getName(val: T): string {
    if (this.translateKeys[val] === undefined) {
      throw new Error(`Could not find name for value ${val}`);
    }

    return this.translateKeys[val];
  }

  containsKey(val: T): boolean {
    return this.translateKeys[val] !== undefined;
  }

  containsKeyCaseInsensitive(val: T): boolean {
    return this.getKeyCaseInsensitive(val) !== undefined;
  }

  /**
   * Attempts to find an enum value that matches the given string, case-insensitive.
   * If one is found, returns the enum value in the correct case.
   * Otherwise, returns undefined.
   */
  getKeyCaseInsensitive(val: T): T | undefined {
    const valLower = val.toLowerCase();
    return Object.keys(this.translateKeys)
      .map((x) => x as T)
      .find((x) => x.toLowerCase() === valLower);
  }

  getSelectOptionsWithInterpolation(
    fn: (key?: string) => string | undefined,
    blankOption = false,
  ): SelectEntity[] {
    const values: SelectEntity[] = [];
    for (const key in this.translateKeys) {
      const value = fn(key);
      if (value !== undefined) {
        values.push({
          id: key,
          label: value,
        });
      }
    }

    if (blankOption) {
      values.unshift({
        id: "",
        label: fn() ?? "",
      });
    }
    return values;
  }

  getSelectOptions(blankOption = false): SelectEntity[] {
    return this.getSelectOptionsWithInterpolation((k) => k, blankOption);
  }

  getSelectOptionsWithSearch(
    searchStr?: string,
    blankOption = false,
  ): SelectEntity[] {
    const valueToFilterOn = (searchStr ?? "").toLowerCase();
    return this.getSelectOptions(blankOption).filter((x) =>
      x.label.toString().toLowerCase().includes(valueToFilterOn),
    );
  }

  getKeyList(): string[] {
    return Object.keys(this.translateKeys);
  }
}
