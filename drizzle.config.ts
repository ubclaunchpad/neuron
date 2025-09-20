import { env } from "@/env";
import { type Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  out: "src/server/db/migrations",
  schema: ["src/server/db/schema/index.ts"],
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  migrations: {
    table: "migrations",
    schema: "public",
  },
} satisfies Config;
