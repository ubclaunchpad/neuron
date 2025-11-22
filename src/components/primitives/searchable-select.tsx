import { ChevronDownIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  InfiniteCommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type InfiniteQueryPage<TItem> = {
  data: TItem[];
  // allow any other fields
  [key: string]: unknown;
};

export type InfiniteQueryLike<TItem> = {
  data?: {
    pages?: InfiniteQueryPage<TItem>[];
  };
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown> | void;
};

export type SearchableSelectItem<TValue> = {
  value: TValue;
  label: string;
};

type SearchableSelectProps<
  TValue,
  TItem extends SearchableSelectItem<TValue>,
> = {
  useSearchHook: (search: string) => InfiniteQueryLike<TItem>;
  value: TValue | null | undefined;
  onSelect: (value: TValue) => void;
  onBlur?: () => void;
  id?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean | "true" | "false";
  inputRef?: React.Ref<HTMLInputElement>;
  placeholder?: string;
  children?: (item: TItem) => React.ReactNode;
};

export function SearchableSelect<
  TValue,
  TItem extends SearchableSelectItem<TValue>,
>({
  useSearchHook,
  value,
  onSelect,
  onBlur,
  placeholder = "Select...",
  children,
  id,
  disabled,
  ["aria-invalid"]: ariaInvalid,
}: SearchableSelectProps<TValue, TItem>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const query = useSearchHook(search);

  const allItems = useMemo<TItem[]>(() => {
    if (!query.data?.pages?.length) return [];
    return query.data.pages.flatMap((page) => page.data);
  }, [query.data]);

  const selectedItem = useMemo(
    () => allItems.find((item) => item.value === value),
    [allItems, value],
  );

  const renderItem = children ?? ((item: TItem) => item.label);

  const handleSelect = (itemValue: TValue) => {
    onSelect(itemValue);
    setOpen(false);
    onBlur?.();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch("");
      onBlur?.();
    }
  };

  // Normalize aria-invalid for DOM
  const ariaInvalidBool =
    ariaInvalid === true || ariaInvalid === "true" ? true : undefined;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          aria-invalid={ariaInvalidBool}
          aria-labelledby={id}
          className="justify-between"
        >
          {selectedItem ? selectedItem.label : placeholder}
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[240px] p-0">
        <Command>
          <CommandInput
            placeholder="Search…"
            value={search}
            onValueChange={setSearch}
            aria-invalid={ariaInvalidBool}
          />

          <InfiniteCommandList query={query}>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup>
              {allItems.map((item) => (
                <CommandItem
                  key={String(item.value)}
                  value={String(item.value)}
                  onSelect={() => handleSelect(item.value)}
                >
                  {renderItem(item)}
                </CommandItem>
              ))}
            </CommandGroup>
          </InfiniteCommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
