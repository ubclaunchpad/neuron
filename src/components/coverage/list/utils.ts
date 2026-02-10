import { format } from "date-fns";
import type { CoverageListItem } from "./coverage-page-context";

export function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export function sortCoverageItemsByStartAt(items: CoverageListItem[]) {
  return [...items].sort(
    (a, b) =>
      toDate(a.shift.startAt).getTime() - toDate(b.shift.startAt).getTime(),
  );
}

export function groupCoverageItemsByDay(items: CoverageListItem[]) {
  const groups = new Map<string, { date: Date; items: CoverageListItem[] }>();

  items.forEach((item) => {
    const start = toDate(item.shift.startAt);
    const key = format(start, "yyyy-MM-dd");
    const group = groups.get(key) ?? { date: start, items: [] };
    group.items.push(item);
    groups.set(key, group);
  });

  return Array.from(groups.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}
