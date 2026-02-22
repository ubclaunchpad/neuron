import { asFunction } from "awilix";
import path from "node:path";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { env } from "@/env";
import * as schema from "@/server/db/schema";
import {
  MigrationsFolder,
  MigrationsSchema,
  MigrationsTable,
} from "../../../drizzle.config";
import { type NeuronContainer } from "../api/di-container";

export type Drizzle = PostgresJsDatabase<typeof schema>;
type TxCallback = Parameters<Drizzle["transaction"]>[0];
export type Transaction = Parameters<TxCallback>[0];

/**
 * Cache the database connection in development.
 * This avoids creating a new connection on every HMR * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  migrationPromise: Promise<void> | undefined;
};
const conn =
  globalForDb.conn ??
  postgres(env.DATABASE_URL, {
    onnotice: () => {}, // Silence postgres NOTICE spam (existing schema/table)
  });

if (env.NODE_ENV !== "production") globalForDb.conn = conn;

// Export the database connection statically for better-auth
export const db = drizzle(conn, { schema });

async function runMigrations() {
  const migrationsFolder = path.resolve(process.cwd(), MigrationsFolder);

  try {
    await migrate(db, {
      migrationsFolder,
      migrationsSchema: MigrationsSchema,
      migrationsTable: MigrationsTable,
    });
  } catch (error) {
    console.error("Failed to run database migrations", error);
    process.exit(1);
  }
}

const migrationPromise = globalForDb.migrationPromise ?? runMigrations();
if (env.NODE_ENV !== "production") globalForDb.migrationPromise = migrationPromise;
await migrationPromise;

// Register the database in the DI container
export function registerDb(container: NeuronContainer) {
  container.register({
    db: asFunction<Drizzle>(() => db).singleton(),
  });
}
