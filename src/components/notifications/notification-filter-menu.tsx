"use client";

import { ListFilter } from "lucide-react";
import { Button } from "@/components/primitives/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Filter } from "./utils";

const filterLabels: Record<Filter, string> = {
  all: "Unread & read",
  unread: "Unread",
  archived: "Archived",
};

interface NotificationFilterMenuProps {
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
}

export function NotificationFilterMenu({
  filter,
  onFilterChange,
}: NotificationFilterMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          tooltip="Filter"
          startIcon={<ListFilter />}
        ></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Filter</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["all", "unread", "archived"] as const).map((f) => (
          <DropdownMenuCheckboxItem
            key={f}
            checked={filter === f}
            onCheckedChange={() => onFilterChange(f)}
          >
            {filterLabels[f]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
