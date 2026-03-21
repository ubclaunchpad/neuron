import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { addMonths, compareAsc, format, startOfToday } from "date-fns";
import { useMemo } from "react";

function monthKeyFromDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthKeyToDate(key: string) {
  const [yStr, mStr] = key.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  return new Date(y, m - 1, 1, 12, 0, 0, 0);
}

export function MonthSelect({
  value,
  onValueChange,
}: {
  value: Date;
  onValueChange: (date: Date) => void;
}) {
  const monthKey = useMemo(() => monthKeyFromDate(value), [value]);

  const monthOptions = useMemo(() => {
    const selectedMonth = monthKeyToDate(monthKey);
    const options = new Set<string>([monthKeyFromDate(startOfToday())]);

    for (let offset = -12; offset <= 12; offset += 1) {
      const date = addMonths(selectedMonth, offset);
      options.add(monthKeyFromDate(date));
    }

    return Array.from(options).sort((a, b) =>
      compareAsc(monthKeyToDate(a), monthKeyToDate(b)),
    );
  }, [monthKey]);

  return (
    <Select
      value={monthKey}
      onValueChange={(k) => onValueChange(monthKeyToDate(k))}
    >
      <SelectTrigger
        className={cn(
          "w-45 rounded-b-none border-none shadow-none ring-0! outline-0",
          "enabled:hover:bg-accent enabled:hover:text-accent-foreground cursor-pointer",
        )}
      >
        <SelectValue>{format(value, "MMMM yyyy")}</SelectValue>
      </SelectTrigger>

      <SelectContent className="max-h-72">
        {monthOptions.map((key) => {
          const date = monthKeyToDate(key);
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
