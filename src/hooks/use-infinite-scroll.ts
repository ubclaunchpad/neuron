import type { InfiniteQueryLike } from "@/components/ui/searchable-select";
import * as React from "react";

export function useInfiniteScroll<TItem>(
  query: InfiniteQueryLike<TItem>,
  options?: { threshold?: number },
) {
  const { threshold = 100 } = options ?? {};

  const handleScroll = React.useCallback<React.UIEventHandler<HTMLDivElement>>(
    (event) => {
      const target = event.currentTarget;

      if (!query.hasNextPage || query.isFetchingNextPage) return;

      const reachedBottom =
        target.scrollTop + target.clientHeight >=
        target.scrollHeight - threshold;

      if (reachedBottom) {
        void query.fetchNextPage();
      }
    },
    [query, threshold],
  );

  return handleScroll;
}
