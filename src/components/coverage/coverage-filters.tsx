"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { format } from "date-fns";
import {
  CalendarIcon,
  Check,
  ChevronDown,
  ListFilter,
  Plus,
  X,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { parseAsUrlEncodedJson } from "@/lib/nuqs";
import { clientApi } from "@/trpc/client";
import { cn } from "@/lib/utils";
import ClassesIcon from "@public/assets/icons/nav/classes.svg";
import { z } from "zod";

// --- Types & constants ---

const coverageTabs = ["upcoming", "resolved", "past", "withdrawn"] as const;
type CoverageTab = (typeof coverageTabs)[number];

const tabLabels: Record<CoverageTab, string> = {
  upcoming: "Upcoming",
  resolved: "Resolved",
  past: "Past",
  withdrawn: "Withdrawn",
};

export type CoverageFilterValues = {
  status?: "open" | "resolved" | "withdrawn";
  from?: Date;
  to?: Date;
  courseIds?: string[];
};

const coverageFilterClassSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const coverageQueryFiltersSchema = z.object({
  classes: z.array(coverageFilterClassSchema).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

type CoverageFilterClass = z.output<typeof coverageFilterClassSchema>;
type CoverageQueryFilters = z.output<typeof coverageQueryFiltersSchema>;

const parseAsCoverageQueryFilters = parseAsUrlEncodedJson(
  coverageQueryFiltersSchema,
).withDefault({});

export function buildFilterInput(
  tab: CoverageTab,
  filters: CoverageQueryFilters,
): CoverageFilterValues {
  const courseIds = (filters.classes ?? []).map((course) => course.id);
  const fromStr = filters.from;
  const toStr = filters.to;
  const input: CoverageFilterValues = {};

  switch (tab) {
    case "upcoming":
      input.status = "open";
      input.from = new Date();
      break;
    case "resolved":
      input.status = "resolved";
      break;
    case "past":
      input.to = new Date();
      break;
    case "withdrawn":
      input.status = "withdrawn";
      break;
  }

  if (fromStr) input.from = new Date(fromStr);
  if (toStr) input.to = new Date(toStr);

  if (courseIds.length > 0) input.courseIds = courseIds;

  return input;
}

// --- Shared filter params hook ---

export function useCoverageFilterParams() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringEnum<CoverageTab>([...coverageTabs]).withDefault("upcoming"),
  );
  const [filters, setFilters] = useQueryState(
    "filters",
    parseAsCoverageQueryFilters,
  );

  const classes = filters.classes ?? [];
  const from = filters.from ?? null;
  const to = filters.to ?? null;

  const setClasses = useCallback(
    (nextClasses: CoverageFilterClass[]) =>
      setFilters((previous) => ({
        ...(previous ?? {}),
        classes: nextClasses.length > 0 ? nextClasses : undefined,
      })),
    [setFilters],
  );

  const setFrom = useCallback(
    (value: string | null) =>
      setFilters((previous) => ({
        ...(previous ?? {}),
        from: value ?? undefined,
      })),
    [setFilters],
  );

  const setTo = useCallback(
    (value: string | null) =>
      setFilters((previous) => ({
        ...(previous ?? {}),
        to: value ?? undefined,
      })),
    [setFilters],
  );

  return {
    tab,
    setTab,
    filters,
    classes,
    setClasses,
    from,
    setFrom,
    to,
    setTo,
  };
}

// --- Main CoverageFilters component ---

export function CoverageFilters() {
  const { tab, setTab, classes, setClasses, from, setFrom, to, setTo } =
    useCoverageFilterParams();

  // Track which chips are visible (local state decoupled from URL values)
  const [showClassChip, setShowClassChip] = useState(classes.length > 0);
  const [showDateChip, setShowDateChip] = useState(!!from || !!to);

  // Whether the filter chips row is expanded
  const [filtersOpen, setFiltersOpen] = useState(
    classes.length > 0 || !!from || !!to,
  );

  // Sync visibility from URL on mount
  useEffect(() => {
    if (classes.length > 0) {
      setShowClassChip(true);
      setFiltersOpen(true);
    }
    if (from || to) {
      setShowDateChip(true);
      setFiltersOpen(true);
    }
  }, [classes.length, from, to]);

  // Count active filters (for badge)
  const activeFilterCount = (classes.length > 0 ? 1 : 0) + (from || to ? 1 : 0);

  const hasChipFilters = showClassChip || showDateChip;

  const clearAllChips = () => {
    setClasses([]);
    setFrom(null);
    setTo(null);
    setShowClassChip(false);
    setShowDateChip(false);
  };

  const allFiltersActive = showClassChip && showDateChip;

  return (
    <div className="flex flex-col gap-3 px-9 pb-4">
      {/* Row 1: Status tabs + Filter button */}
      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          variant="tab"
          size="sm"
          spacing={0.5}
          value={tab}
          onValueChange={(value) => {
            if (value) setTab(value as CoverageTab);
          }}
        >
          {coverageTabs.map((t) => (
            <ToggleGroupItem key={t} value={t} className="text-sm">
              {tabLabels[t]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {/* Filter button: dropdown when no filters, toggle when filters exist */}
        {activeFilterCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <ListFilter />
            Filter
            <Badge variant="filter" color="emphasis">
              {activeFilterCount}
            </Badge>
          </Button>
        ) : (
          <FilterDropdownButton
            allFiltersActive={allFiltersActive}
            onAddClass={() => {
              setShowClassChip(true);
              setFiltersOpen(true);
            }}
            onAddDateRange={() => {
              setShowDateChip(true);
              setFiltersOpen(true);
            }}
          />
        )}
      </div>

      {/* Row 2: Filter chips (collapsible) */}
      {filtersOpen && hasChipFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {showClassChip && (
              <ClassFilterChip
                selectedClasses={classes}
                onChange={setClasses}
                onClear={() => {
                  setClasses([]);
                  setShowClassChip(false);
                }}
              />
            )}

            {showDateChip && (
              <DateRangeFilterChip
                from={from}
                to={to}
                onChange={(range) => {
                  console.log(range);
                  setFrom(range?.from ? range.from.toISOString() : null);
                  setTo(range?.to ? range.to.toISOString() : null);
                }}
                onClear={() => {
                  setFrom(null);
                  setTo(null);
                  setShowDateChip(false);
                }}
              />
            )}

            {!allFiltersActive && (
              <AddChipButton
                hasClass={showClassChip}
                hasDateRange={showDateChip}
                onAddClass={() => setShowClassChip(true)}
                onAddDateRange={() => setShowDateChip(true)}
              />
            )}
          </div>

          {hasChipFilters && (
            <Button
              variant="ghost"
              size="sm"
              tooltip="Clear Filters"
              onClick={clearAllChips}
              className="text-muted-foreground ml-auto"
            >
              <X />
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// --- Filter dropdown button (shown in row 1 when no active filters) ---

function FilterDropdownButton({
  allFiltersActive,
  onAddClass,
  onAddDateRange,
}: {
  allFiltersActive: boolean;
  onAddClass: () => void;
  onAddDateRange: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (allFiltersActive) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ListFilter />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-1" align="start">
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2"
            onClick={() => {
              onAddClass();
              setOpen(false);
            }}
          >
            <ClassesIcon />
            Class
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2"
            onClick={() => {
              onAddDateRange();
              setOpen(false);
            }}
          >
            <CalendarIcon />
            Date Range
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- "+" button in filter chips row (to add more chips) ---

function AddChipButton({
  hasClass,
  hasDateRange,
  onAddClass,
  onAddDateRange,
}: {
  hasClass: boolean;
  hasDateRange: boolean;
  onAddClass: () => void;
  onAddDateRange: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="size-8 p-0"
          tooltip="Add Filter"
        >
          <Plus />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-1" align="start">
        <div className="flex flex-col">
          {!hasClass && (
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={() => {
                onAddClass();
                setOpen(false);
              }}
            >
              <ClassesIcon />
              Class
            </Button>
          )}
          {!hasDateRange && (
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={() => {
                onAddDateRange();
                setOpen(false);
              }}
            >
              <CalendarIcon />
              Date Range
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- Class Filter Chip (multi-select with +N) ---

function ClassFilterChip({
  selectedClasses,
  onChange,
  onClear,
}: {
  selectedClasses: CoverageFilterClass[];
  onChange: (classes: CoverageFilterClass[]) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const autoOpened = useRef(false);

  const { data: availableClasses } = clientApi.class.names.useQuery(undefined, {
    enabled: open,
  });

  useEffect(() => {
    if (!autoOpened.current && selectedClasses.length === 0) {
      autoOpened.current = true;
      setOpen(true);
    }
  }, [selectedClasses.length]);

  const filtered = useMemo(() => {
    if (!availableClasses) return [];
    if (!search) return availableClasses;
    const lower = search.toLowerCase();
    return availableClasses.filter((c) => c.name.toLowerCase().includes(lower));
  }, [availableClasses, search]);

  const selectedClassIds = useMemo(
    () => new Set(selectedClasses.map((course) => course.id)),
    [selectedClasses],
  );

  const toggleClass = (course: CoverageFilterClass) => {
    if (selectedClassIds.has(course.id)) {
      onChange(selectedClasses.filter((selected) => selected.id !== course.id));
    } else {
      onChange([...selectedClasses, course]);
    }
  };

  const firstName = selectedClasses[0]?.name;
  const extraCount = selectedClasses.length - 1;

  return (
    <div className="flex items-center">
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-r-none border-r-0 gap-1.5"
          >
            <ClassesIcon />
            Class
            {firstName && (
              <Badge variant="filter" color="emphasis">
                {firstName}
              </Badge>
            )}
            {extraCount > 0 && (
              <Badge variant="filter" color="emphasis">
                +{extraCount}
              </Badge>
            )}
            <ChevronDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search classes..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No classes found.</CommandEmpty>
              <CommandGroup>
                {filtered.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    onSelect={() => toggleClass({ id: c.id, name: c.name })}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        selectedClassIds.has(c.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="sm"
        className="rounded-l-none px-1.5"
        onClick={onClear}
      >
        <X />
      </Button>
    </div>
  );
}

// --- Date Range Filter Chip ---

function DateRangeFilterChip({
  from,
  to,
  onChange,
  onClear,
}: {
  from: string | null;
  to: string | null;
  onChange: (range: DateRange | undefined) => void;
  onClear: () => void;
}) {
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;
  const hasValue = !!fromDate && !!toDate;

  const [open, setOpen] = useState(false);
  const autoOpened = useRef(false);

  useEffect(() => {
    if (!autoOpened.current && !hasValue) {
      autoOpened.current = true;
      setOpen(true);
    }
  }, [hasValue]);

  const label = hasValue
    ? [
        fromDate ? format(fromDate, "MMM dd, yyyy") : "",
        toDate ? format(toDate, "MMM dd, yyyy") : "",
      ]
        .filter(Boolean)
        .join(" - ")
    : null;

  return (
    <div className="flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-r-none border-r-0 gap-1.5"
          >
            <CalendarIcon />
            Date Range
            {label && (
              <Badge variant="filter" color="emphasis">
                {label}
              </Badge>
            )}
            <ChevronDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="range"
            selected={
              fromDate || toDate ? { from: fromDate, to: toDate } : undefined
            }
            onDayClick={(day) => {
              if (fromDate && !toDate) {
                onChange({ from: fromDate, to: day });
              } else {
                onChange({ from: day });
              }
            }}
            numberOfMonths={1}
            autoFocus
            captionLayout="dropdown"
            startMonth={new Date(new Date().getFullYear() - 5, 11, 31)}
            endMonth={new Date(new Date().getFullYear() + 5, 11, 31)}
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="sm"
        className="rounded-l-none px-1.5"
        onClick={onClear}
      >
        <X />
      </Button>
    </div>
  );
}
