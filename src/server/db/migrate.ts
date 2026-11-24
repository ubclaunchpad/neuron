import { drizzle } from "drizzle-orm/postgres-js";
import { migrate as migrationRunner } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env } from "@/env";
import {
  MigrationsFolder,
  MigrationsSchema,
  MigrationsTable,
} from "@/server/db/migration-config";

export async function migrate() {
  // Only run in the Node.js runtime, not the Edge runtime.
  // Also skip during `next build`,  no DB is available at build time.
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }

  const migrationClient = postgres(env.DATABASE_URL, {
    max: 1,
    onnotice: () => {},
  });

  try {
    console.log("Running migrations...");
    await migrationRunner(drizzle({ client: migrationClient }), {
      migrationsFolder: MigrationsFolder,
      migrationsSchema: MigrationsSchema,
      migrationsTable: MigrationsTable,
    });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Failed to run database migrations", error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}
