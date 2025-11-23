import { cn } from "@/lib/utils";
import type { JSX } from "react";
import { Card } from "../primitives/card";

export function ListItem({
  leadingContent,
  mainContent,
  endContent,
}: {
  leadingContent?: React.ReactNode;
  mainContent?: React.ReactNode;
  endContent?: React.ReactNode;
}) {
  return (
    <Card
      size="sm"
      className="flex flex-row justify-between px-4 gap-2 md:gap-4 items-center"
    >
      {leadingContent}

      {mainContent && <div className="flex-1 min-w-0">{mainContent}</div>}

      {endContent}
    </Card>
  );
}

export function ListBody<TItem>({
  items,
  children,
}: {
  items: TItem[];
  children: (value: TItem, index: number, array: TItem[]) => JSX.Element;
}) {
  return <div className="space-y-2">{items.map(children)}</div>;
}

export function ListEmptyState({ query }: { query: string }) {
  return (
    <ListStateWrapper>
      No results found
      {query && (
        <>
          {" "}
          for <span className="font-medium">"{query}"</span>
        </>
      )}
    </ListStateWrapper>
  );
}

export function ListLoadingState() {
  return (
    <ListStateWrapper className="text-muted-foreground">
      Loading...
    </ListStateWrapper>
  );
}

export function ListStateWrapper({
  className,
  ...rest
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("py-6 text-center text-sm", className)} {...rest} />
  );
}
