import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "@/server/db/schema";
import { sql } from "drizzle-orm";
import { env } from "@/env";
import {
  MigrationsFolder,
  MigrationsSchema,
  MigrationsTable,
} from "@/server/db/migration-config";

const testDbUrl = env.DATABASE_URL;

let conn: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getTestDb() {
  if (!db) {
    conn = postgres(testDbUrl, {
      max: 1,
      onnotice: () => {}, // Suppress NOTICE messages from PostgreSQL
    });
    db = drizzle({ client: conn, schema });
  }
  return db;
}

async function runMigrations() {
  const db = getTestDb();
  await migrate(db, {
    migrationsFolder: MigrationsFolder,
    migrationsTable: MigrationsTable,
    migrationsSchema: MigrationsSchema,
  });
}

function assertSafeTestDatabaseUrl(url: string): void {
  let dbName: string;
  try {
    dbName = new URL(url).pathname.replace(/^\/+/, "");
  } catch {
    throw new Error(`Invalid test DATABASE_URL: "${url}"`);
  }

  if (!dbName.endsWith("_test")) {
    throw new Error(
      `Refusing to reset database "${dbName}": test database name must end with "_test".`,
    );
  }
}

export async function resetDatabase() {
  assertSafeTestDatabaseUrl(testDbUrl);
  const db = getTestDb();

  // Drop and recreate schemas to clear all data, tables, and pg-boss state
  await db.execute(sql`DROP SCHEMA IF EXISTS pgboss CASCADE`);
  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS public`);

  // Re-run migrations
  await runMigrations();
}

export async function closeDatabase() {
  if (conn) {
    await conn.end();
    conn = null;
    db = null;
  }
}
