import { CreateInstructorInput, DeleteInstructorInput, UpdateInstructorInput } from "@/models/api/instructor";
import { adminProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const instructorRouter = createTRPCRouter({
    list: adminProcedure
        .query(async () => {
            // TODO: getInstructors
            return [];
        }),
    create: adminProcedure
        .input(CreateInstructorInput)
        .mutation(async ({ input, ctx }) => {
            // TODO: insertInstructor
            return { ok: true };
        }),
    update: adminProcedure
        .input(UpdateInstructorInput)
        .mutation(async ({ input, ctx }) => {
            // TODO: editInstructor
            return { ok: true };
        }),
    delete: adminProcedure
        .input(DeleteInstructorInput)
        .mutation(async ({ input, ctx }) => {
            // TODO: deleteInstructor
            return { ok: true };
        }),
});