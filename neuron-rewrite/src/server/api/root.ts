import { classRouter } from "@/server/api/routers/classController";
import { coverageRouter } from "@/server/api/routers/coverageRouter";
import { instructorRouter } from "@/server/api/routers/instructorController";
import { logRouter } from "@/server/api/routers/logController";
import { shiftRouter } from "@/server/api/routers/shiftController";
import { volunteerRouter } from "@/server/api/routers/volunteerController";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

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
    instructor: instructorRouter,
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
