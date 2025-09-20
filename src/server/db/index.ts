import { asFunction } from "awilix";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";
import * as schema from "@/server/db/schema";
import { type NeuronContainer } from "../api/di-container";

export type Drizzle = PostgresJsDatabase<typeof schema>;
type TxCallback = Parameters<Drizzle["transaction"]>[0];
export type Transaction = Parameters<TxCallback>[0];

/**
 * Cache the database connection in development.
 * This avoids creating a new connection on every HMR * update.
 */
const globalForDb = globalThis as unknown as { conn: postgres.Sql | undefined };
const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);

if (env.NODE_ENV !== "production") globalForDb.conn = conn;

// Export the database connection statically for better-auth
export const db = drizzle(conn, { schema });

// Register the database in the DI container
export function registerDb(container: NeuronContainer) {
  container.register({
    db: asFunction<Drizzle>(() => db).singleton(),
  });
}
