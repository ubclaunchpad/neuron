import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import type { TRPCError } from "@trpc/server";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError: ({ path, error }: { path: string | undefined, error: TRPCError }) => {
      console.error(`tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
      if (error.cause instanceof Error) {
        console.error(error.cause);
      }
    },
  });

export { handler as GET, handler as POST };
