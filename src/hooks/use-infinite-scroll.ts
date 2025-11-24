import * as React from "react";

export type InfiniteQueryLike = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown> | void;
};

export function useInfiniteScroll(
  query: InfiniteQueryLike,
  options?: { threshold?: number },
) {
  const { threshold = 100 } = options ?? {};

  const handleScroll = React.useCallback<
    React.UIEventHandler<HTMLDivElement>
  >(
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
