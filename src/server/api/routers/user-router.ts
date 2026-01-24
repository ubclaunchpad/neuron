import {
  CreateInstructorInput,
  DeleteInstructorInput,
  InstructorIdInput,
  UpdateInstructorInput,
} from "@/models/api/instructor";
import { CreateUserInput, ListUsersInput, UserIdInput } from "@/models/api/user";
import type { ListResponse } from "@/models/list-response";
import { getListUser, type ListUser } from "@/models/user";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  list: authorizedProcedure({ permission: { users: ["view"] } })
    .input(ListUsersInput)
    .query(async ({ input, ctx }): Promise<ListResponse<ListUser>> => {
      const request = await ctx.userService.getUsersForRequest(input);

      return {
        data: request.data.map(getListUser),
        nextCursor: request.nextCursor,
        total: request.total,
      };
    }),
  byId: authorizedProcedure({ permission: { users: ["view"] } })
    .input(UserIdInput)
    .query(async ({ input, ctx }) => {
      return await ctx.userService.getUser(input.userId);
    }),
  instructors: authorizedProcedure({ permission: { users: ["view"] } })
    .input(ListUsersInput)
    .query(async ({ input, ctx }): Promise<ListResponse<ListUser>> => {
      const request = await ctx.userService.getInstructorsForRequest(input);

      return {
        data: request.data.map(getListUser),
        nextCursor: request.nextCursor,
        total: request.total,
      };
    }),
  instructorById: authorizedProcedure({ permission: { users: ["view"] } })
    .input(InstructorIdInput)
    .query(async ({ input, ctx }) => {
      return await ctx.userService.getInstructor(input.instructorId);
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
  createInstructor: authorizedProcedure({ permission: { users: ["create"] } })
    .input(CreateInstructorInput)
    .mutation(async ({ input, ctx }) => {
      const instructor = await ctx.userService.createInstructor(input);
      return { userId: instructor.id };
    }),
  updateInstructor: authorizedProcedure({ permission: { users: ["update"] } })
    .input(UpdateInstructorInput)
    .mutation(async ({ input, ctx }) => {
      const instructor = await ctx.userService.updateInstructor(input);
      return { userId: instructor.id };
    }),
  deleteInstructor: authorizedProcedure({ permission: { users: ["update"] } })
    .input(DeleteInstructorInput)
    .mutation(async ({ input, ctx }) => {
      const deletedId = await ctx.userService.deleteInstructor(
        input.instructorId,
      );
      return { userId: deletedId };
    }),
});
