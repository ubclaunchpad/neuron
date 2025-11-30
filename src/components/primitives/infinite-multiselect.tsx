import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../primitives/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  InfiniteCommandList,
} from "../ui/command";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupButton,
} from "../ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";

export type SelectEntity = {
  id: string;
  label: string | React.ReactNode;
};

type InfiniteMultiSelectProps<
  TEntity extends SelectEntity,
  TQueryData extends { entities: TEntity[] },
> = {
  useInfiniteQuery: (search: string) => UseInfiniteQueryResult<TQueryData, any>;
  values: TEntity[];
  onAppend: (entity: TEntity) => void;
  onRemove: (idx: number, entity: TEntity) => void;
  renderLabel?: (entity: TEntity) => React.ReactNode;
  renderListItem?: (entity: TEntity) => React.ReactNode;
  renderTooltip?: ((entity: TEntity) => React.ReactNode) | boolean;
  placeholder?: string;
  buttonText?: string;
  emptyText?: string;
  entityName?: string;
};

function InfiniteMultiSelect<
  TEntity extends SelectEntity,
  TQueryData extends { entities: TEntity[] },
>({
  values,
  onAppend,
  onRemove,
  useInfiniteQuery,
  renderListItem,
  renderTooltip,
  renderLabel,
  placeholder = "Add item...",
  emptyText,
  entityName = "items",
}: InfiniteMultiSelectProps<TEntity, TQueryData>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const infiniteQuery = useInfiniteQuery(query);

  const entities = (infiniteQuery.data?.entities ?? []).filter(
    (e) => !values.some((v) => v.id === e.id),
  );

  return (
    <div className="flex gap-2">
      {values.map((value, idx) => {
        const content = (
          <InputGroup className="w-fit gap-1">
            <InputGroupAddon align="inline-start">
              <InputGroupText>
                {renderLabel ? renderLabel(value) : value.label}
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <InputGroupButton variant="ghost" size="icon-xs" asChild>
                <Button
                  unstyled
                  tooltip="Remove"
                  onClick={() => onRemove(idx, value)}
                >
                  <X />
                </Button>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        );

        return !!renderTooltip ? (
          <Tooltip key={value.id}>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent>
              {typeof renderTooltip === "function"
                ? renderTooltip(value)
                : value.label}
            </TooltipContent>
          </Tooltip>
        ) : (
          content
        );
      })}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between !text-muted-foreground"
          >
            {placeholder}
            <Plus className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0">
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder={`Search ${entityName}...`}
            />
            <InfiniteCommandList query={infiniteQuery}>
              <CommandEmpty>
                {emptyText ?? `No ${entityName} found.`}
              </CommandEmpty>
              <CommandGroup>
                {entities.map((entity) => (
                  <CommandItem
                    key={entity.id}
                    value={entity.id}
                    onSelect={() => onAppend(entity)}
                  >
                    {renderListItem ? renderListItem(entity) : entity.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </InfiniteCommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { InfiniteMultiSelect };
