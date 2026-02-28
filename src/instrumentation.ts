import { migrate } from "@/server/db/migrate";

/**
 * Next.js instrumentation hook. Called exactly once when the server process
 * starts (both in development and production). This is the right place to run
 * one-time startup work like database migrations.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  await migrate();
}
