import { CreateUserInput, ListUsersInput, UserIdInput } from "@/models/api/user";
import { getListUser } from "@/models/user";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  list: authorizedProcedure({ permission: { users: ["view"] } })
    .input(ListUsersInput)
    .query(async ({ input, ctx }) => {
      const request = await ctx.userService.getUsersForRequest(input);

      return {
        data: request.data.map(getListUser),
        nextCursor: request.nextCursor,
        total: request.total
      }
    }),
  byId: authorizedProcedure({ permission: { users: ["view"] } })
    .input(UserIdInput)
    .query(async ({ input, ctx }) => {
      return await ctx.userService.getUser(input.userId);
    }),
  activate: authorizedProcedure({ permission: { users: ["activate"] } })
    .input(UserIdInput)
    .mutation(async ({ input, ctx }) => {
      const id = await ctx.userService.verifyVolunteer(input.userId);
      return { userId: id };
    }),
  deactivate: authorizedProcedure({ permission: { users: ["deactivate"] } })
    .input(UserIdInput)
    .mutation(async ({ input, ctx }) => {
      const id = await ctx.userService.deactivateUser(input.userId);
      return { userId: id };
    }),
  reject: authorizedProcedure({ permission: { users: ["activate"] } })
    .input(UserIdInput)
    .mutation(async ({ input, ctx }) => {
      const id = await ctx.userService.rejectVolunteer(input.userId);
      return { userId: id };
    }),
  verificationCount: authorizedProcedure({ permission: { users: ["view"] } })
    .query(async ({ input, ctx }) => {
      const count = await ctx.userService.getVerificationRequestCount();
      return count;
    }),
  create: authorizedProcedure({ permission: { users: ["create"] } })
    .input(CreateUserInput)
    .mutation(async ({ input, ctx }) => {
      const createdUser = await ctx.userService.createUser(input);
      return { userId: createdUser.id };
    }),
});
