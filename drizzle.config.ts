import { env } from "@/env";
import { defineConfig } from "drizzle-kit";
import {
  MigrationsFolder,
  MigrationsSchema,
  MigrationsTable,
} from "./src/server/db/migration-config";

export default defineConfig({
  dialect: "postgresql",
  out: MigrationsFolder,
  schema: ["src/server/db/schema/index.ts"],
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  migrations: {
    table: MigrationsTable,
    schema: MigrationsSchema,
  },
  strict: true,
  verbose: true,
});
