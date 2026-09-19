"use client";

import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function MonthSelect({
  value,
  onValueChange,
}: {
  value: Date;
  onValueChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-45 justify-between rounded-b-none px-4 font-normal shadow-none",
            "hover:bg-accent hover:text-accent-foreground",
          )}
          aria-label={`Choose month, ${format(value, "MMMM yyyy")}`}
        >
          <span>{format(value, "MMMM yyyy")}</span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <MonthPicker
          className="w-60"
          selectedMonth={value}
          onMonthSelect={(date) => {
            onValueChange(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
