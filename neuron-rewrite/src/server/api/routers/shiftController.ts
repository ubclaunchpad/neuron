import {
    CreateShiftInput,
    GetShiftsInput,
    ShiftIdInput,
    UpdateShiftInput
} from "@/models/api/shift";
import { adminProcedure, authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const shiftRouter = createTRPCRouter({
    create: adminProcedure
        .input(CreateShiftInput)
        .mutation(async ({ input }) => {
            // TODO: addShift
            return { ok: true };
        }),
    list: authorizedProcedure
        .input(GetShiftsInput)
        .query(async ({ input }) => {
            // TODO: getShifts
            return [];
        }),
    checkIn: authorizedProcedure
        .input(ShiftIdInput)
        .mutation(async ({ input }) => {
            // TODO: checkInShift
            return { ok: true };
        }),
    byId: authorizedProcedure
        .input(ShiftIdInput)
        .query(async ({ input }) => {
            // TODO: getShift
            return { /* shift */ };
        }),
    update: adminProcedure
        .input(ShiftIdInput.merge(UpdateShiftInput))
        .mutation(async ({ input }) => {
            // TODO: updateShift
            return { ok: true };
        }),
    delete: adminProcedure
        .input(ShiftIdInput)
        .mutation(async ({ input }) => {
            // TODO: deleteShift (note: original used PUT for delete)
            return { ok: true };
        }),
});