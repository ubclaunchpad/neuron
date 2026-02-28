"use client";

import * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createParser, useQueryState } from "nuqs";
import { format } from "date-fns";
import {
  CalendarIcon,
  Check,
  ChevronDown,
  ListFilter,
  Plus,
  X,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

export type FilterOption = { label: string; value: string };
export type DateRangeValue = { from?: string; to?: string };
export type FilterBarValues = Record<string, FilterOption[] | DateRangeValue>;

type FilterRegistration = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
};

type FilterBarContextValue = {
  // URL state
  values: FilterBarValues;
  setValue: (
    key: string,
    value: FilterOption[] | DateRangeValue | undefined,
  ) => void;
  clearValue: (key: string) => void;
  clearAll: () => void;

  // Registry
  registry: Map<string, FilterRegistration>;
  register: (key: string, meta: FilterRegistration) => void;
  unregister: (key: string) => void;

  // UI visibility
  visibleChips: Set<string>;
  showChip: (key: string) => void;
  hideChip: (key: string) => void;
  openKey: string | null;
  setOpenKey: (key: string | null) => void;
  expanded: boolean;
  toggleExpanded: () => void;
  activeFilterCount: number;
};

const filterBarParser = createParser<FilterBarValues>({
  parse: (query) => {
    try {
      const decoded = decodeURIComponent(query);
      return JSON.parse(decoded) as FilterBarValues;
    } catch {
      return null;
    }
  },
  serialize: (value) => encodeURIComponent(JSON.stringify(value)),
  eq: (a, b) => JSON.stringify(a) === JSON.stringify(b),
}).withDefault({});

const FilterBarContext = createContext<FilterBarContextValue | null>(null);

function useFilterBarContext() {
  const ctx = useContext(FilterBarContext);
  if (!ctx) {
    throw new Error("FilterBar sub-components must be used within <FilterBar>");
  }
  return ctx;
}

export function useFilterBarValues(queryKey: string): FilterBarValues {
  const [values] = useQueryState(queryKey, filterBarParser);
  return (values ?? {}) as FilterBarValues;
}

function FilterBar({
  queryKey,
  children,
  className,
}: {
  queryKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [values, setValues] = useQueryState(queryKey, filterBarParser);
  const currentValues = (values ?? {}) as FilterBarValues;

  const [registry, setRegistry] = useState<Map<string, FilterRegistration>>(
    () => new Map(),
  );

  const [manualVisibleChips, setManualVisibleChips] = useState<Set<string>>(
    new Set(),
  );
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const register = useCallback((key: string, meta: FilterRegistration) => {
    setRegistry((prev) => {
      const existing = prev.get(key);
      if (existing?.label === meta.label && existing?.icon === meta.icon) {
        return prev;
      }
      const next = new Map(prev);
      next.set(key, meta);
      return next;
    });
  }, []);

  const unregister = useCallback((key: string) => {
    setRegistry((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const setValue = useCallback(
    (key: string, value: FilterOption[] | DateRangeValue | undefined) => {
      setValues((prev) => {
        const current = (prev ?? {}) as FilterBarValues;
        if (value === undefined) {
          const { [key]: _, ...rest } = current;
          return Object.keys(rest).length > 0 ? rest : null;
        }
        return { ...current, [key]: value };
      });
    },
    [setValues],
  );

  const clearValue = useCallback(
    (key: string) => {
      setValues((prev) => {
        const current = (prev ?? {}) as FilterBarValues;
        const { [key]: _, ...rest } = current;
        return Object.keys(rest).length > 0 ? rest : null;
      });
    },
    [setValues],
  );

  const clearAll = useCallback(() => {
    setValues(null);
    setManualVisibleChips(new Set());
    setOpenKey(null);
    setExpanded(false);
  }, [setValues]);

  const showChip = useCallback((key: string) => {
    setManualVisibleChips((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setOpenKey(key);
    setExpanded(true);
  }, []);

  const hideChip = useCallback(
    (key: string) => {
      setManualVisibleChips((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setOpenKey((current) => (current === key ? null : current));
      clearValue(key);
    },
    [clearValue],
  );

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const activeValueKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const [key, val] of Object.entries(currentValues)) {
      if (Array.isArray(val) && val.length > 0) {
        keys.add(key);
      } else if (
        val &&
        typeof val === "object" &&
        !Array.isArray(val) &&
        (val.from || val.to)
      ) {
        keys.add(key);
      }
    }
    return keys;
  }, [currentValues]);

  const visibleChips = useMemo(() => {
    const next = new Set(activeValueKeys);
    for (const key of manualVisibleChips) next.add(key);
    return next;
  }, [activeValueKeys, manualVisibleChips]);

  const activeFilterCount = activeValueKeys.size;

  const contextValue = useMemo<FilterBarContextValue>(
    () => ({
      values: currentValues,
      setValue,
      clearValue,
      clearAll,
      registry,
      register,
      unregister,
      visibleChips,
      showChip,
      hideChip,
      openKey,
      setOpenKey,
      expanded,
      toggleExpanded,
      activeFilterCount,
    }),
    [
      currentValues,
      setValue,
      clearValue,
      clearAll,
      registry,
      register,
      unregister,
      visibleChips,
      showChip,
      hideChip,
      openKey,
      setOpenKey,
      expanded,
      toggleExpanded,
      activeFilterCount,
    ],
  );

  return (
    <FilterBarContext.Provider value={contextValue}>
      <div
        data-slot="filter-bar"
        className={cn("flex flex-col gap-3", className)}
      >
        {children}
      </div>
    </FilterBarContext.Provider>
  );
}

function FilterBarRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="filter-bar-row"
      className={cn("flex items-center gap-2", className)}
    >
      {children}
    </div>
  );
}

function FilterBarTrigger({ className }: { className?: string }) {
  const {
    activeFilterCount,
    registry,
    visibleChips,
    showChip,
    toggleExpanded,
  } = useFilterBarContext();
  const [open, setOpen] = useState(false);

  if (activeFilterCount > 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5", className)}
        onClick={toggleExpanded}
      >
        <ListFilter />
        Filter
        <Badge variant="filter" color="emphasis">
          {activeFilterCount}
        </Badge>
      </Button>
    );
  }

  const hiddenFilters = Array.from(registry.entries()).filter(
    ([key]) => !visibleChips.has(key),
  );

  if (hiddenFilters.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5", className)}
        onClick={toggleExpanded}
      >
        <ListFilter />
        Filter
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1.5", className)}
        >
          <ListFilter />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-45 p-1"
        align="start"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex flex-col">
          {hiddenFilters.map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
                onClick={() => {
                  showChip(key);
                  setOpen(false);
                }}
              >
                {Icon && <Icon />}
                {meta.label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterBarContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { expanded, visibleChips } = useFilterBarContext();

  const isVisible = expanded && visibleChips.size > 0;

  return (
    <div
      data-slot="filter-bar-content"
      className={cn(
        "flex items-center gap-2 flex-wrap",
        !isVisible && "hidden",
        className,
      )}
    >
      <div className="flex items-center gap-2 flex-wrap flex-1">{children}</div>
    </div>
  );
}

function FilterBarMultiSelect({
  filterKey,
  label,
  icon: Icon,
  options,
  multiple = false,
  searchable = true,
  searchPlaceholder,
  emptyMessage,
  className,
}: {
  filterKey: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  options: FilterOption[];
  multiple?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}) {
  const {
    values,
    setValue,
    register,
    unregister,
    visibleChips,
    hideChip,
    openKey,
    setOpenKey,
  } = useFilterBarContext();

  const [search, setSearch] = useState("");

  const value = (values[filterKey] as FilterOption[] | undefined) ?? [];

  // Register with provider
  useEffect(() => {
    register(filterKey, { label, icon: Icon });
    return () => unregister(filterKey);
  }, [filterKey, label, Icon, register, unregister]);

  const isVisible = visibleChips.has(filterKey);
  const isOpen = openKey === filterKey;

  useEffect(() => {
    if (!isVisible) {
      setSearch("");
      if (isOpen) setOpenKey(null);
    }
  }, [isVisible, isOpen, setOpenKey]);

  if (!isVisible) return null;

  const selectedValues = new Set(value.map((v) => v.value));

  const toggleOption = (option: FilterOption) => {
    if (selectedValues.has(option.value)) {
      const next = value.filter((v) => v.value !== option.value);
      setValue(filterKey, next.length > 0 ? next : undefined);
    } else {
      setValue(filterKey, [...value, option]);
    }

    if (!multiple) {
      setOpenKey(null);
    }
  };

  const filtered = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  const firstName = value[0]?.label;
  const extraCount = value.length - 1;

  return (
    <div className={cn("flex items-center", className)}>
      <Popover
        open={isOpen}
        onOpenChange={(o) => {
          setOpenKey(o ? filterKey : null);
          if (!o) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-r-none border-r-0 gap-1.5"
          >
            {Icon && <Icon />}
            {label}
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
        <PopoverContent className="w-55 p-0" align="start">
          <Command shouldFilter={false}>
            {searchable && (
              <CommandInput
                placeholder={
                  searchPlaceholder ?? `Search ${label.toLowerCase()}...`
                }
                value={search}
                onValueChange={setSearch}
              />
            )}
            <CommandList>
              <CommandEmpty>
                {emptyMessage ?? `No ${label.toLowerCase()} found.`}
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => toggleOption(option)}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        selectedValues.has(option.value)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {option.label}
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
        onClick={() => hideChip(filterKey)}
      >
        <X />
      </Button>
    </div>
  );
}

function FilterBarDateRange({
  filterKey,
  label,
  icon: Icon = CalendarIcon,
  className,
}: {
  filterKey: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const {
    values,
    setValue,
    register,
    unregister,
    visibleChips,
    hideChip,
    openKey,
    setOpenKey,
  } = useFilterBarContext();

  const value = (values[filterKey] as DateRangeValue | undefined) ?? {};
  const fromDate = value.from ? new Date(value.from) : undefined;
  const toDate = value.to ? new Date(value.to) : undefined;

  // Register with provider
  useEffect(() => {
    register(filterKey, { label, icon: Icon });
    return () => unregister(filterKey);
  }, [filterKey, label, Icon, register, unregister]);

  const isVisible = visibleChips.has(filterKey);
  const isOpen = openKey === filterKey;
  useEffect(() => {
    if (!isVisible) {
      if (isOpen) setOpenKey(null);
    }
  }, [isVisible, isOpen, setOpenKey]);

  if (!isVisible) return null;

  const dateLabel =
    fromDate && toDate
      ? `${format(fromDate, "MMM dd, yyyy")} - ${format(toDate, "MMM dd, yyyy")}`
      : fromDate
        ? format(fromDate, "MMM dd, yyyy")
        : null;

  const handleDayClick = (day: Date) => {
    if (fromDate && !toDate) {
      setValue(filterKey, {
        from: fromDate.toISOString(),
        to: day.toISOString(),
      });
    } else {
      setValue(filterKey, { from: day.toISOString() });
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      <Popover
        open={isOpen}
        onOpenChange={(o) => setOpenKey(o ? filterKey : null)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-r-none border-r-0 gap-1.5"
          >
            <Icon />
            {label}
            {dateLabel && (
              <Badge variant="filter" color="emphasis">
                {dateLabel}
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
            onDayClick={handleDayClick}
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
        onClick={() => hideChip(filterKey)}
      >
        <X />
      </Button>
    </div>
  );
}

function FilterBarAdd({ className }: { className?: string }) {
  const { registry, visibleChips, showChip } = useFilterBarContext();
  const [open, setOpen] = useState(false);

  const hiddenFilters = Array.from(registry.entries()).filter(
    ([key]) => !visibleChips.has(key),
  );

  if (hiddenFilters.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("size-8 p-0", className)}
          tooltip="Add Filter"
        >
          <Plus />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-45 p-1"
        align="start"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex flex-col">
          {hiddenFilters.map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
                onClick={() => {
                  showChip(key);
                  setOpen(false);
                }}
              >
                {Icon && <Icon />}
                {meta.label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterBarClear({ className }: { className?: string }) {
  const { clearAll, visibleChips } = useFilterBarContext();

  if (visibleChips.size === 0) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      tooltip="Clear Filters"
      onClick={clearAll}
      className={cn("text-muted-foreground ml-auto", className)}
    >
      <X />
      Clear
    </Button>
  );
}

export {
  FilterBar,
  FilterBarRow,
  FilterBarTrigger,
  FilterBarContent,
  FilterBarMultiSelect,
  FilterBarDateRange,
  FilterBarAdd,
  FilterBarClear,
};
