import {
    AdminSignoffInput,
    GetVolunteersInput,
    ShiftCheckInInput,
    UpdateVolunteerInput,
    VolunteerIdInput
} from "@/models/api/volunteer";
import { adminProcedure, authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const volunteerRouter = createTRPCRouter({
    list: adminProcedure
        .input(GetVolunteersInput)
        .query(async ({ input }) => {
            // TODO: getVolunteers
            return [];
        }),
    shiftCheckIn: authorizedProcedure
        .input(ShiftCheckInInput)
        .mutation(async ({ input }) => {
            // TODO: shiftCheckIn
            return { ok: true };
        }),
    update: authorizedProcedure
        .input(UpdateVolunteerInput)
        .mutation(async ({ input }) => {
            // TODO: updateVolunteer
            return { ok: true };
        }),
    classPreferencesAll: authorizedProcedure
        .query(async () => {
            // TODO: getAllClassPreferences
            return [];
        }),
    classPreferencesById: authorizedProcedure
        .input(VolunteerIdInput)
        .query(async ({ input }) => {
            // TODO: getPreferredClassesById
            return [];
        }),
    classPreferencesUpdate: authorizedProcedure
        .input(VolunteerIdInput)
        .mutation(async ({ input }) => {
            // TODO: updatePreferredClassesById
            return { ok: true };
        }),
    byId: authorizedProcedure
        .input(VolunteerIdInput)
        .query(async ({ input }) => {
            // TODO: getVolunteerById
            return { /* volunteer */ };
        }),
    verify: adminProcedure
        .input(VolunteerIdInput.merge(AdminSignoffInput))
        .mutation(async ({ input }) => {
            // TODO: verifyVolunteer
            return { ok: true };
        }),
    deactivate: adminProcedure
        .input(VolunteerIdInput.merge(AdminSignoffInput))
        .mutation(async ({ input }) => {
            // TODO: deactivateVolunteer
            return { ok: true };
        }),
});