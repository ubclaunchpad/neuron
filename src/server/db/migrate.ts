import { migrate as migrationRunner } from "drizzle-orm/postgres-js/migrator";
import { db } from "@/server/db";
import {
  MigrationsFolder,
  MigrationsSchema,
  MigrationsTable,
} from "../../../drizzle.config";

export async function migrate() {
  // Only run in the Node.js runtime, not the Edge runtime.
  // Also skip during `next build`,  no DB is available at build time.
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }

  try {
    console.log("Running migrations...");
    await migrationRunner(db, {
      migrationsFolder: MigrationsFolder,
      migrationsSchema: MigrationsSchema,
      migrationsTable: MigrationsTable,
    });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Failed to run database migrations", error);
  }
}
