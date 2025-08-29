import { GetLogsInput } from "@/models/api/log";
import { adminProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const logRouter = createTRPCRouter({
    list: adminProcedure
        .input(GetLogsInput)
        .query(async ({ input }) => {
            // TODO: getLogs
            return { items: [], page: input.page ?? 1, perPage: input.perPage ?? 50 };
        }),
});