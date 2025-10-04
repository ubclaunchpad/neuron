import diff from "microdiff";
import type { FieldNamesMarkedBoolean, FieldValues } from "react-hook-form";
import type { Primitive } from "zod/v3";

export const filterFormFields = <T extends FieldValues>(
    allFields: T,
    dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<T>>>
): Partial<T> => {
    const changedFieldValues = Object.keys(dirtyFields).reduce((acc, currentField) => {
        return {
            ...acc,
            [currentField]: allFields[currentField]
        }
    }, {} as Partial<T>);

    return changedFieldValues;
};

export const diffArray = <T extends Primitive>(
  beforeArray: T[],
  afterArray: T[],
): {
  added: Array<T>;
  deleted: Array<T>;
} => {
    const changes = diff(beforeArray, afterArray);
    const added: Array<T> = changes.filter(c => c.type === "CREATE" || c.type === "CHANGE").map(c => c.value);
    const deleted: Array<T> = changes.filter(c => c.type === "REMOVE" || c.type === "CHANGE").map(c => c.oldValue);
    return { added, deleted };
}

export const diffEntityArray = <
  T extends Record<string, any>,
  TId extends keyof T
>(
  beforeArray: T[],
  afterArray: T[],
  idKey: TId
): {
  added: Array<Omit<T, TId>>;
  edited: Array<T & Record<TId, NonNullable<T[TId]>>>;
  deletedIds: Array<NonNullable<T[TId]>>;
} => {
    const added: Array<Omit<T, TId>> = [];
    const edited: Array<T & Record<TId, NonNullable<T[TId]>>> = [];
    const deletedIds: Array<NonNullable<T[TId]>> = [];

    // Added
    added.concat(afterArray.filter(a => !a[idKey]));

    // Edited
    const beforeById = new Map<T[TId], T>(beforeArray.map(b => [b[idKey], b]));
    const afterById = new Map<T[TId], T>(afterArray.filter(a => !!a[idKey]).map(a => [a[idKey], a]));
    for (const [id, after] of afterById) {
        const before = beforeById.get(id);

        if (!before)
            continue;

        const changes = diff(before, after);
        if (changes.length > 0) {
            edited.push(after);
        }
    }

    // Deleted
    for (const [id] of beforeById) {
        if (!afterById.has(id)) {
            deletedIds.push(id);
        }
    }

    return { added, edited, deletedIds };
};


