import { createStringEnum } from "./typeUtils.js";

export const Role = createStringEnum(['admin', 'volunteer', 'instructor'] as const);
export type Role = typeof Role.values[number];

export const ShiftStatus = createStringEnum(['absence-pending', 'open', 'coverage-pending', 'resolved'] as const);
export type ShiftStatus = typeof ShiftStatus.values[number];

export const ShiftQueryType = createStringEnum(['coverage', 'absence'] as const);
export type ShiftQueryType = typeof ShiftQueryType.values[number];
