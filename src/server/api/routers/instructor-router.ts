import { ListRequestWithSearch } from "@/models/api/common";
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
  })
    .input(ListRequestWithSearch)
    .query(async ({ input, ctx }) => {
      return await ctx.instructorService.getInstructorsForRequest(input);
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
