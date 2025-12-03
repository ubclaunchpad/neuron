import {
  defaultShouldDehydrateQuery,
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { TRPCError } from "@trpc/server";
import { toast } from "sonner";
import superjson from "superjson";

export const createQueryClient = () =>
  new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _1, _2, mutation) => {
        if (!mutation.meta?.suppressToast) {
          toast.error(error.message);
        }
      },
    }),
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (!query.meta?.suppressToast) {
          toast.error(error.message);
        }
      },
    }),
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        retry: (attempt, error) => {
          if (
            error instanceof TRPCError &&
            (error?.code === "TOO_MANY_REQUESTS" ||
              error?.code === "GATEWAY_TIMEOUT" ||
              error?.code === "TIMEOUT" ||
              error?.code === "INTERNAL_SERVER_ERROR")
          ) {
            return attempt < 3;
          }
          return false;
        },
        retryDelay: (attempt) => 1000 * 2 ** attempt,
        meta: { suppressToast: false },
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
