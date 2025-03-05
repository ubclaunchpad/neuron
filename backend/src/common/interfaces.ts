import { createStringEnum } from "./typeUtils.js";

export const Role = createStringEnum(['admin', 'volunteer', 'instructor'] as const);
export type Role = typeof Role.values[number];

export const ShiftStatus = createStringEnum(['open', 'pending', 'resolved'] as const);
export type ShiftStatus = typeof ShiftStatus.values[number];

export const ShiftQueryType = createStringEnum(['coverage', 'requesting'] as const);
export type ShiftQueryType = typeof ShiftQueryType.values[number];
