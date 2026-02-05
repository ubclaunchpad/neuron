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
} from "../../drizzle.config";

const testDbUrl = env.DATABASE_URL;

let conn: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getTestDb() {
  if (!db) {
    conn = postgres(testDbUrl, {
      max: 1,
      onnotice: () => {}, // Suppress NOTICE messages from PostgreSQL
    });
    db = drizzle(conn, { schema });
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

export async function resetDatabase() {
  const db = getTestDb();

  // Drop and recreate public schema to clear all data and tables
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
