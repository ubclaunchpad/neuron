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
      // TODO: insertInstructor
      return { ok: true };
    }),
  update: authorizedProcedure({ permission: { users: ["update-instructor"] } })
    .input(UpdateInstructorInput)
    .mutation(async ({ input, ctx }) => {
      // TODO: editInstructor
      return { ok: true };
    }),
  delete: authorizedProcedure({ permission: { users: ["delete-instructor"] } })
    .input(DeleteInstructorInput)
    .mutation(async ({ input, ctx }) => {
      // TODO: deleteInstructor
      return { ok: true };
    }),
});
