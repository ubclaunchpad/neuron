import { env } from "@/env";
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment: env.NODE_ENV,
    });

    const { migrate } = await import("@/server/db/migrate");
    await migrate();
  }
}
