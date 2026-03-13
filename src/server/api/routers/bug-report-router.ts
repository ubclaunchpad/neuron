import * as Sentry from "@sentry/nextjs";
import { publicProcedure } from "@/server/api/procedures";
import { createTRPCRouter } from "@/server/api/trpc";
import { z } from "zod";

const SubmitBugReportInput = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export const bugReportRouter = createTRPCRouter({
  submit: publicProcedure
    .input(SubmitBugReportInput)
    .mutation(async ({ input }) => {
      // Send to Bugsink via Sentry SDK
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

      return { success: true };
    }),
});
