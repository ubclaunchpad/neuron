import { type ReactNode, isValidElement } from "react";

export function nullthy<T>(
  value: T | null | undefined,
): value is null | undefined {
  return !value;
}

export function isReactNodeNullthy(node: ReactNode): boolean {
  if (node === null || node === undefined || node === false) return true;

  if (Array.isArray(node)) {
    return node.every(isReactNodeNullthy);
  }

  // strings, numbers, and elements render something
  // (fragments/portals are still elements here)
  if (typeof node === "string" || typeof node === "number") return false;

  if (isValidElement(node)) return false;

  // should not really happen for ReactNode, but for safety:
  return true;
}
