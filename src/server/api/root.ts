import { classRouter } from "@/server/api/routers/class-router";
import { coverageRouter } from "@/server/api/routers/coverage-router";
import { logRouter } from "@/server/api/routers/log-router";
import { profileRouter } from "@/server/api/routers/profile-router";
import { shiftRouter } from "@/server/api/routers/shift-router";
import { termRouter } from "@/server/api/routers/term-router";
import { userRouter } from "@/server/api/routers/user-router";
import { volunteerRouter } from "@/server/api/routers/volunteer-router";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { storageRouter } from "./routers/storage-router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  volunteer: volunteerRouter,
  class: classRouter,
  shift: shiftRouter,
  coverage: coverageRouter,
  log: logRouter,
  user: userRouter,
  term: termRouter,
  profile: profileRouter,
  storage: storageRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
