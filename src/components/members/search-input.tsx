import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";
import { Spinner } from "../ui/spinner";

export function SearchInput({
  query,
  onQueryChange,
  className,
  ...rest
}: React.ComponentProps<"div"> & {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const [internalQuery, setInternalQuery] = useState(query);
  const [debouncedQuery, isDebouncing, setDebouncedInstantly] = useDebouncedValue(internalQuery, 250);

  // Keep external and external query in sync
  useEffect(() => {
    if (query != debouncedQuery)
      onQueryChange(debouncedQuery);
  }, [debouncedQuery]);
  useEffect(() => {
    if (internalQuery != query)
      setInternalQuery(query);
  }, [query]);

  return (
    <InputGroup className={cn("!ring-0", className)} {...rest}>
      <InputGroupAddon align="inline-start">
        {isDebouncing ? (
          <Spinner className="shrink-0 opacity-50" />
        ) : (
          <Search className="shrink-0 opacity-50" />
        )}
      </InputGroupAddon>

      <InputGroupInput
        value={internalQuery}
        onChange={(e) => setInternalQuery(e.currentTarget.value)}
        placeholder="Search by name or email..."
      />

      <InputGroupAddon align="inline-end">
        <InputGroupButton
          variant="ghost"
          size="icon-xs"
          className={cn(
            "transition-opacity",
            query ? "opacity-60" : "opacity-0 pointer-events-none",
          )}
          onClick={() => {
            // Reset both
            setDebouncedInstantly("");
          }}
        >
          <X />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
