"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  addMonths,
  compareAsc,
  format,
  parseISO,
  startOfToday,
} from "date-fns";
import { useMemo } from "react";

export function MonthSelect({
  value,
  onValueChange,
}: {
  value: Date;
  onValueChange: (date: Date) => void;
}) {
  const monthKey = useMemo(
    () => format(value, "yyyy-MM"),
    [value],
  );

  const monthOptions = useMemo(() => {
    const selectedMonth = parseISO(`${monthKey}-01T00:00:00`);
    const options = new Set<string>([format(startOfToday(), "yyyy-MM")]);

    for (let offset = -12; offset <= 12; offset += 1) {
      const date = addMonths(selectedMonth, offset);
      options.add(format(date, "yyyy-MM"));
    }

    return Array.from(options).sort((a, b) =>
      compareAsc(parseISO(`${a}-01T00:00:00`), parseISO(`${b}-01T00:00:00`)),
    );
  }, [monthKey]);

  return (
    <Select
      value={monthKey}
      onValueChange={(value) =>
        onValueChange?.(parseISO(`${value}-01T00:00:00`))
      }
    >
      <SelectTrigger
        className={cn(
          "w-[180px] rounded-b-none border-none shadow-none !ring-0 outline-0",
          "enabled:hover:bg-accent enabled:hover:text-accent-foreground cursor-pointer",
        )}
      >
        <SelectValue placeholder="Month" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {monthOptions.map((key) => {
          const date = parseISO(`${key}-01T00:00:00`);
          return (
            <SelectItem key={key} value={key}>
              {format(date, "MMMM yyyy")}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
