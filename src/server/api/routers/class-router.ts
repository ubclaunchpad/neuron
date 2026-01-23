import {
  ClassIdInput,
  ClassRequest,
  CreateClass,
  UpdateClass,
} from "@/models/api/class";
import {
  getListClass,
  getSingleClass,
  type ClassResponse,
  type ListClass,
  type SingleClass,
} from "@/models/class";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const classRouter = createTRPCRouter({
  list: authorizedProcedure({ permission: { classes: ["view"] } })
    .input(ClassRequest)
    .query(async ({ input, ctx }): Promise<ClassResponse<ListClass>> => {
      const classes = await ctx.classService.getClassesForRequest(input);
      return {
        classes: classes.classes.map(getListClass),
        term: classes.term,
      };
    }),
  byId: authorizedProcedure({ permission: { classes: ["view"] } })
    .input(ClassIdInput)
    .query(async ({ input, ctx }): Promise<SingleClass> => {
      const cls = await ctx.classService.getClass(input.classId);
      return getSingleClass(cls);
    }),
  create: authorizedProcedure({ permission: { classes: ["create"] } })
    .input(CreateClass)
    .mutation(async ({ input, ctx }): Promise<string> => {
      const id = await ctx.classService.createClass(input);
      return id;
    }),
  update: authorizedProcedure({ permission: { classes: ["update"] } })
    .input(UpdateClass)
    .mutation(async ({ input, ctx }): Promise<void> => {
      await ctx.classService.updateClass(input);
    }),
  delete: authorizedProcedure({ permission: { classes: ["delete"] } })
    .input(ClassIdInput)
    .mutation(async ({ input, ctx }): Promise<void> => {
      await ctx.classService.deleteClass(input.classId);
    }),
  publish: authorizedProcedure({ permission: { classes: ["create"] } })
    .input(ClassIdInput)
    .mutation(async ({ input, ctx }): Promise<void> => {
      await ctx.classService.publishClass(input.classId);
    }),
  publishAll: authorizedProcedure({
    permission: { classes: ["create"] },
  }).mutation(async ({ ctx }): Promise<void> => {
    await ctx.classService.publishAllClasses();
  }),
});
