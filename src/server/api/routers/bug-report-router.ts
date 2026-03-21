import * as Sentry from "@sentry/nextjs";
import { SubmitBugReportInput } from "@/models/api/bug-report";
import { authorizedProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";

export const bugReportRouter = createTRPCRouter({
  submit: authorizedProcedure()
    .input(SubmitBugReportInput)
    .mutation(async ({ input }) => {
      Sentry.captureMessage(input.title, {
        level: "info",
        tags: {
          type: "user_bug_report",
        },
        extra: {
          description: input.description,
          email: input.email || "not provided",
        },
      });
    }),
});
