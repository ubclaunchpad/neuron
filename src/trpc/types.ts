import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export type AppRouter = typeof import("@/server/api/root").appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
