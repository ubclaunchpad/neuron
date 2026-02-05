import { env } from "@/env";
import { type Config } from "drizzle-kit";

export const MigrationsFolder = "src/server/db/migrations";
export const MigrationsTable = "migrations";
export const MigrationsSchema = "public";

export default {
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
} satisfies Config;
