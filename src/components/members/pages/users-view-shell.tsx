import { ScrollArea } from "@/components/ui/scroll-area";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { cn } from "@/lib/utils";
import { Role, Status } from "@/models/interfaces";
import type { ListUser } from "@/models/user";
import { clientApi } from "@/trpc/client";
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type JSX
} from "react";
import {
  ListBody,
  ListEmptyState,
  ListLoadingState,
  ListStateWrapper,
} from "../list";
import { SearchInput } from "../search-input";

type UsersViewShellContextValue = {
  query: string;
  setQuery: (value: string) => void;
  handleScroll: React.UIEventHandler<any>;
  users: ListUser[];
  hasUsers: boolean;
  isLoading: boolean;
  isReloading: boolean;
  isEmpty: boolean;
  showNoMoreResults: boolean;
};

const UsersViewShellContext = createContext<UsersViewShellContextValue | null>(
  null,
);

function useUsersViewShellContext() {
  const ctx = useContext(UsersViewShellContext);
  if (!ctx) {
    throw new Error(
      "ShellSearchInput and UsersList must be used within <UsersViewShell>",
    );
  }
  return ctx;
}

type UsersViewShellProps = {
  statusesToInclude?: Status[];
  rolesToInclude?: Role[];
};

export function UsersViewShell({
  statusesToInclude,
  rolesToInclude,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & UsersViewShellProps) {
  const [query, setQuery] = useState("");

  const infiniteQuery = clientApi.user.list.useInfiniteQuery(
    {
      search: query,
      statusesToInclude,
      rolesToInclude,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      placeholderData: (prev) => prev,
      select: (data) => ({
        ...data,
        users: data.pages.flatMap((page) => page.data) ?? [],
      }),
    },
  );

  const users = infiniteQuery.data?.users ?? [];

  const hasUsers = users.length > 0;
  const isLoading = infiniteQuery.isFetching;
  const isReloading = isLoading && !infiniteQuery.isFetchingNextPage;
  const isEmpty = !isLoading && !hasUsers;
  const showNoMoreResults =
    !isLoading && hasUsers && !infiniteQuery.hasNextPage;

  const handleScroll = useInfiniteScroll(infiniteQuery);

  const value = useMemo<UsersViewShellContextValue>(
    () => ({
      query,
      setQuery,
      users,
      handleScroll,
      hasUsers,
      isLoading,
      isReloading,
      isEmpty,
      showNoMoreResults,
    }),
    [
      query,
      users,
      handleScroll,
      hasUsers,
      isLoading,
      isReloading,
      isEmpty,
      showNoMoreResults,
    ],
  );

  return (
    <UsersViewShellContext.Provider value={value}>
      <div
        className={cn(
          "w-full h-full min-h-auto grid grid-rows-[auto_1fr] overflow-hidden",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </UsersViewShellContext.Provider>
  );
}

export function ShellHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex justify-between gap-2 mb-3", className)} {...props} />
  );
}

export function ShellSearchInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof SearchInput>, "query" | "onQueryChange">) {
  const { query, setQuery } = useUsersViewShellContext();

  return (
    <SearchInput
      query={query}
      onQueryChange={setQuery}
      className={cn("max-w-80", className)}
      {...props}
    />
  );
}

export function UsersList({
  children,
}: {
  children: (value: ListUser, index: number, array: ListUser[]) => JSX.Element;
}) {
  const {
    query,
    users,
    handleScroll,
    isLoading,
    isReloading,
    isEmpty,
    showNoMoreResults,
  } = useUsersViewShellContext();

  return (
    <ScrollArea onScroll={handleScroll} className="-mx-9 px-9">
      <div className="pb-10">
        {!isReloading && <ListBody items={users} children={children}/>}

        {isLoading && <ListLoadingState />}

        {showNoMoreResults && (
          <ListStateWrapper className="text-muted-foreground">
            No more results
          </ListStateWrapper>
        )}

        {isEmpty && <ListEmptyState query={query} />}
      </div>
    </ScrollArea>
  );
}
