import {
  defaultShouldDehydrateQuery,
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";
import superjson from "superjson";
import { forceLogout } from "@/lib/auth/logout";

const unauthorized = (error: unknown) =>
  error instanceof TRPCClientError &&
  error.data?.code &&
  error.data.code === "UNAUTHORIZED";

const shouldRetry = (attempt: number, error: unknown) => {
  if (error instanceof TRPCClientError) {
    const code = error.data?.code;
    if (
      code === "TOO_MANY_REQUESTS" ||
      code === "GATEWAY_TIMEOUT" ||
      code === "TIMEOUT" ||
      code === "INTERNAL_SERVER_ERROR"
    ) {
      return attempt < 3;
    }
  }
  return false;
};

const handleError = (error: unknown, suppressToast?: boolean) => {
  if (unauthorized(error)) {
    void forceLogout();
    return;
  }
  if (!suppressToast && error instanceof Error) {
    toast.error(error.message);
  }
};

export const createQueryClient = () =>
  new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _1, _2, mutation) =>
        handleError(error, mutation.meta?.suppressToast),
    }),
    queryCache: new QueryCache({
      onError: (error, query) => handleError(error, query.meta?.suppressToast),
    }),
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        retry: (attempt, error) => {
          if (unauthorized(error)) return false;
          return shouldRetry(attempt, error);
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
