import diff from "microdiff";
import type { ControllerRenderProps, FieldNamesMarkedBoolean, FieldPath, FieldPathValue, FieldValues } from "react-hook-form";
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
    added.push(...afterArray.filter(a => !a[idKey]));

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

type OnChangeValue<UI> = (value: UI) => void;

type AdaptFieldCore<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>, UI> = {
    toUI: (formValue: FieldPathValue<TFieldValues, TName>) => UI;
    toForm: (uiValue: UI) => FieldPathValue<TFieldValues, TName>;
};

// Overload 1: target component has value-onChange signature: onChange(UI)
export function adaptField<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
    UI
>(
    field: ControllerRenderProps<TFieldValues, TName>,
    opts: AdaptFieldCore<TFieldValues, TName, UI>
): Omit<ControllerRenderProps<TFieldValues, TName>, "value" | "onChange"> & {
    value: UI;
    onChange: OnChangeValue<UI>;
};

// Overload 2: target component fires DOM events: onChange(event)
export function adaptField<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
    UI
>(
    field: ControllerRenderProps<TFieldValues, TName>,
    opts: AdaptFieldCore<TFieldValues, TName, UI> & {
        fromEvent: (...args: any[]) => UI;
    }
): Omit<ControllerRenderProps<TFieldValues, TName>, "value" | "onChange"> & {
    onChange: (...args: any[]) => void;
    value: UI;
};

export function adaptField<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
    UI
>(
    field: ControllerRenderProps<TFieldValues, TName>,
    opts: AdaptFieldCore<TFieldValues, TName, UI> & { fromEvent?: (...args: any[]) => UI }
) {
    const { toUI, toForm, fromEvent } = opts;

    const base = {
        name: field.name,
        ref: field.ref,
        onBlur: field.onBlur,
        disabled: field.disabled,
    } as const;

    if (fromEvent) {
        return {
            ...base,
            value: toUI(field.value as FieldPathValue<TFieldValues, TName>),
            onChange: (...args: any[]) => {
                const ui = fromEvent(...args);
                field.onChange(toForm(ui));
            },
        };
    }

    return {
        ...base,
        value: toUI(field.value as FieldPathValue<TFieldValues, TName>),
        onChange: (ui: UI) => field.onChange(toForm(ui)),
    };
}
