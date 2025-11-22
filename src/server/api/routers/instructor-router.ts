import {
  CreateInstructorInput,
  DeleteInstructorInput,
  UpdateInstructorInput,
} from "@/models/api/instructor";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const instructorRouter = createTRPCRouter({
  list: authorizedProcedure({
    permission: { users: ["view-instructor"] },
  }).query(async () => {
    // TODO: getInstructors
    return [];
  }),
  create: authorizedProcedure({ permission: { users: ["create-instructor"] } })
    .input(CreateInstructorInput)
    .mutation(async ({ input, ctx }) => {
      await ctx.instructorService.createInstructor(
        input.firstName,
        input.lastName,
        input.email
      )
      return { ok: true };
    }),
  update: authorizedProcedure({ permission: { users: ["update-instructor"] } })
    .input(UpdateInstructorInput)
    .mutation(async ({ input, ctx }) => {
      await ctx.instructorService.updateInstructor(input.instructorId, {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
      });
      return { ok: true };
    }),
  delete: authorizedProcedure({ permission: { users: ["delete-instructor"] } })
    .input(DeleteInstructorInput)
    .mutation(async ({ input, ctx }) => {
      await ctx.instructorService.deleteInstructor(input.instructorId);
      return { ok: true };
    }),
});
