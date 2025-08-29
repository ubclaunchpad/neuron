import {
    ClassIdInput,
    CreateClassInput,
    UpdateClassInput,
} from "@/models/api/class";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const classRouter = createTRPCRouter({
    list: authorizedProcedure.query(async ({ ctx }) => {
        // TODO: getAllClasses
        return [];
    }),
    create: authorizedProcedure.input(CreateClassInput).mutation(async ({ input, ctx }) => {
        // TODO: addClass
        return { id: 1 };
    }),
    byId: authorizedProcedure.input(ClassIdInput).query(async ({ input, ctx }) => {
        // TODO: getClassById
        return { };
    }),
    update: authorizedProcedure.input(UpdateClassInput).mutation(async ({ input, ctx }) => {
        // TODO: updateClass
        return { ok: true };
    }),
    delete: authorizedProcedure.input(ClassIdInput).mutation(async ({ input, ctx }) => {
        // TODO: deleteClass
        return { ok: true };
    }),
});