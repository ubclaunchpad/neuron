"use client";

// Adapted from https://github.com/gr3enk/shadcn-ui-monthpicker.
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

type Month = {
  number: number;
  name: string;
};

const MONTHS: Month[][] = [
  [
    { number: 0, name: "Jan" },
    { number: 1, name: "Feb" },
    { number: 2, name: "Mar" },
  ],
  [
    { number: 3, name: "Apr" },
    { number: 4, name: "May" },
    { number: 5, name: "Jun" },
  ],
  [
    { number: 6, name: "Jul" },
    { number: 7, name: "Aug" },
    { number: 8, name: "Sep" },
  ],
  [
    { number: 9, name: "Oct" },
    { number: 10, name: "Nov" },
    { number: 11, name: "Dec" },
  ],
];

type ButtonVariant =
  | "default"
  | "outline"
  | "ghost"
  | "link"
  | "destructive"
  | "secondary"
  | null
  | undefined;

type MonthCalProps = {
  selectedMonth?: Date;
  onMonthSelect?: (date: Date) => void;
  onYearForward?: () => void;
  onYearBackward?: () => void;
  callbacks?: {
    yearLabel?: (year: number) => string;
    monthLabel?: (month: Month) => string;
  };
  variant?: {
    calendar?: {
      main?: ButtonVariant;
      selected?: ButtonVariant;
    };
    chevrons?: ButtonVariant;
  };
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
};

function MonthPicker({
  onMonthSelect,
  selectedMonth,
  minDate,
  maxDate,
  disabledDates,
  callbacks,
  onYearBackward,
  onYearForward,
  variant,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & MonthCalProps) {
  return (
    <div className={cn("w-60 min-w-[200px] p-3", className)} {...props}>
      <div className="flex w-full flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <div className="w-full space-y-4">
          <MonthCal
            onMonthSelect={onMonthSelect}
            callbacks={callbacks}
            selectedMonth={selectedMonth}
            onYearBackward={onYearBackward}
            onYearForward={onYearForward}
            variant={variant}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
          />
        </div>
      </div>
    </div>
  );
}

function MonthCal({
  selectedMonth,
  onMonthSelect,
  callbacks,
  variant,
  minDate,
  maxDate,
  disabledDates,
  onYearBackward,
  onYearForward,
}: MonthCalProps) {
  const [year, setYear] = React.useState(
    selectedMonth?.getFullYear() ?? new Date().getFullYear(),
  );
  const [month, setMonth] = React.useState(
    selectedMonth?.getMonth() ?? new Date().getMonth(),
  );
  const [menuYear, setMenuYear] = React.useState(year);

  React.useEffect(() => {
    if (!selectedMonth) return;
    setYear(selectedMonth.getFullYear());
    setMonth(selectedMonth.getMonth());
    setMenuYear(selectedMonth.getFullYear());
  }, [selectedMonth]);

  const normalizedMinDate =
    minDate && maxDate && minDate > maxDate ? maxDate : minDate;
  const disabledDatesMapped = disabledDates?.map((date) => ({
    year: date.getFullYear(),
    month: date.getMonth(),
  }));

  return (
    <>
      <div className="relative mb-3 flex items-center justify-center pt-1">
        <div className="text-sm font-medium" aria-live="polite">
          {callbacks?.yearLabel ? callbacks.yearLabel(menuYear) : menuYear}
        </div>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => {
              setMenuYear(menuYear - 1);
              onYearBackward?.();
            }}
            className={cn(
              buttonVariants({ variant: variant?.chevrons ?? "outline" }),
              "absolute left-1 inline-flex h-7 w-7 items-center justify-center p-0",
            )}
            aria-label={`Show ${menuYear - 1}`}
          >
            <ChevronLeft className="h-4 w-4 opacity-50" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuYear(menuYear + 1);
              onYearForward?.();
            }}
            className={cn(
              buttonVariants({ variant: variant?.chevrons ?? "outline" }),
              "absolute right-1 inline-flex h-7 w-7 items-center justify-center p-0",
            )}
            aria-label={`Show ${menuYear + 1}`}
          >
            <ChevronRight className="h-4 w-4 opacity-50" />
          </button>
        </div>
      </div>
      <div
        role="grid"
        aria-label={`Months in ${menuYear}`}
        className="space-y-2"
      >
        {MONTHS.map((monthRow, row) => (
          <div key={`row-${row}`} role="row" className="grid grid-cols-3 gap-2">
            {monthRow.map((monthOption) => {
              const isSelected =
                month === monthOption.number && menuYear === year;
              const isDisabled =
                (maxDate
                  ? menuYear > maxDate.getFullYear() ||
                    (menuYear === maxDate.getFullYear() &&
                      monthOption.number > maxDate.getMonth())
                  : false) ||
                (normalizedMinDate
                  ? menuYear < normalizedMinDate.getFullYear() ||
                    (menuYear === normalizedMinDate.getFullYear() &&
                      monthOption.number < normalizedMinDate.getMonth())
                  : false) ||
                (disabledDatesMapped?.some(
                  (date) =>
                    date.year === menuYear && date.month === monthOption.number,
                ) ??
                  false);

              return (
                <div
                  key={monthOption.number}
                  role="gridcell"
                  className="relative h-9 p-0 text-center text-sm focus-within:z-20"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMonth(monthOption.number);
                      setYear(menuYear);
                      onMonthSelect?.(new Date(menuYear, monthOption.number));
                    }}
                    disabled={isDisabled}
                    className={cn(
                      buttonVariants({
                        variant: isSelected
                          ? (variant?.calendar?.selected ?? "default")
                          : (variant?.calendar?.main ?? "ghost"),
                      }),
                      "h-full w-full rounded-md p-0 font-normal aria-selected:opacity-100",
                    )}
                    aria-label={`Choose ${monthOption.name} ${menuYear}`}
                    aria-selected={isSelected}
                  >
                    {callbacks?.monthLabel
                      ? callbacks.monthLabel(monthOption)
                      : monthOption.name}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

MonthPicker.displayName = "MonthPicker";

export { MonthPicker };
