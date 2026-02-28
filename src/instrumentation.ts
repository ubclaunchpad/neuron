/**
 * Next.js instrumentation hook. Called exactly once when the server process
 * starts (both in development and production). This is the right place to run
 * one-time startup work like database migrations.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run in the Node.js runtime, not the Edge runtime.
  // Also skip during `next build` — no DB is available at build time.
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }

  const path = await import("node:path");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const { db } = await import("@/server/db");
  const { MigrationsFolder, MigrationsSchema, MigrationsTable } =
    await import("../drizzle.config");

  const migrationsFolder = path.resolve(process.cwd(), MigrationsFolder);

  try {
    console.log("Running migrations...");
    await migrate(db, {
      migrationsFolder,
      migrationsSchema: MigrationsSchema,
      migrationsTable: MigrationsTable,
    });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Failed to run database migrations", error);
    process.exit(1);
  }
}
