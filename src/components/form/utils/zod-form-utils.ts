import z from "zod";

/**
 * https://twitter.com/jjenzz/status/1612531220780294174?s=20&t=VYqGsLYl_9H-CSenMZ-hCg
 * Usage:  email: asOptionalField(z.string().email())
 */
export const emptyStringToUndefined = z.literal('').transform(() => undefined);
export const emptyStringToNull = z.literal('').transform(() => null);

export function asOptionalField<T extends z.ZodTypeAny>(schema: T) {
	return z.union([emptyStringToUndefined, schema.optional()]);
}

export function asNullishField<T extends z.ZodTypeAny>(schema: T) {
	return z.union([emptyStringToNull, schema.nullable()]);
}