"use client";

import { Temporal } from "@js-temporal/polyfill";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { clientApi, type RouterOutputs } from "@/trpc/client";
import type { ListShift } from "@/models/shift";

type UseShiftRangeOptions = {
  start: Date;
  end: Date;
  userId?: string;
  courseId?: string;
  scheduleId?: string;
  enabled?: boolean;
};

const toInstant = (date: Date) => Temporal.Instant.from(date.toISOString());

const toPlainDate = (date: Date) =>
  toInstant(date).toZonedDateTimeISO(Temporal.Now.timeZoneId()).toPlainDate();

const formatMonthCursor = (pd: Temporal.PlainDate) =>
  `${pd.year.toString().padStart(4, "0")}-${pd.month
    .toString()
    .padStart(2, "0")}`;

const monthFromCursor = (cursor: string) =>
  Temporal.PlainDate.from(`${cursor}-01`);

const offsetCursor = (cursor: string, offset: number) =>
  formatMonthCursor(monthFromCursor(cursor).add({ months: offset }));

const monthsInRange = (start: Date, end: Date) => {
  const orderedStart =
    Temporal.Instant.compare(toInstant(start), toInstant(end)) <= 0
      ? start
      : end;
  const orderedEnd = orderedStart === start ? end : start;

  let cursor = toPlainDate(orderedStart).with({ day: 1 });
  const endMonth = toPlainDate(orderedEnd).with({ day: 1 });

  const months: string[] = [];
  while (Temporal.PlainDate.compare(cursor, endMonth) <= 0) {
    months.push(formatMonthCursor(cursor));
    cursor = cursor.add({ months: 1 });
  }

  return months;
};

const isWithinRange = (value: Date, start: Date, end: Date) => {
  const val = toInstant(value);
  const startInstant = toInstant(start);
  const endInstant = toInstant(end);

  return (
    Temporal.Instant.compare(val, startInstant) >= 0 &&
    Temporal.Instant.compare(val, endInstant) <= 0
  );
};

export function useShiftRange({
  start,
  end,
  userId,
  courseId,
  scheduleId,
  enabled = true,
}: UseShiftRangeOptions) {
  const requiredMonths = useMemo(() => monthsInRange(start, end), [start, end]);
  const requiredMonthsKey = requiredMonths.join("|");

  const utils = clientApi.useUtils();

  const shiftQuery = useQuery({
    queryKey: [
      "shift-range",
      requiredMonthsKey,
      userId ?? null,
      courseId ?? null,
      scheduleId ?? null,
    ],
    enabled: enabled && requiredMonths.length > 0,
    queryFn: async () => {
      console.log(userId, courseId, scheduleId);
      const pages = await Promise.all(
        requiredMonths.map((cursor) =>
          utils.shift.list.fetch({ cursor, userId, courseId, scheduleId }),
        ),
      );
      return pages;
    },
  });

  // Opportunistically prefetch the month before and after the requested range
  useEffect(() => {
    if (!enabled || !requiredMonths.length) return;

    const beforeCursor = offsetCursor(requiredMonths[0]!, -1);
    const afterCursor = offsetCursor(
      requiredMonths[requiredMonths.length - 1]!,
      1,
    );

    void utils.shift.list.prefetch({
      cursor: beforeCursor,
      userId,
      courseId,
      scheduleId,
    });
    void utils.shift.list.prefetch({
      cursor: afterCursor,
      userId,
      courseId,
      scheduleId,
    });
  }, [
    enabled,
    requiredMonths,
    requiredMonthsKey,
    userId,
    courseId,
    scheduleId,
    utils.shift.list,
  ]);

  const shifts = useMemo(() => {
    if (!shiftQuery.data) return [] as ListShift[];

    const rangeStart =
      Temporal.Instant.compare(toInstant(start), toInstant(end)) <= 0
        ? start
        : end;
    const rangeEnd = rangeStart === start ? end : start;

    const byId = new Map<string, ListShift>();

    for (const page of shiftQuery.data) {
      for (const shift of page.shifts ?? []) {
        const shiftStart =
          shift.startAt instanceof Date
            ? shift.startAt
            : new Date(shift.startAt);
        if (!isWithinRange(shiftStart, rangeStart, rangeEnd)) continue;

        if (!byId.has(shift.id)) {
          byId.set(shift.id, shift);
        }
      }
    }

    return Array.from(byId.values()).sort((a, b) => {
      const aDate = a.startAt instanceof Date ? a.startAt : new Date(a.startAt);
      const bDate = b.startAt instanceof Date ? b.startAt : new Date(b.startAt);
      return Temporal.Instant.compare(toInstant(aDate), toInstant(bDate));
    });
  }, [shiftQuery.data, start, end]);

  return {
    shifts,
    months: requiredMonths,
    query: shiftQuery,
  };
}
