import fs from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

const DEFAULT_TEST_DB_NAME = "neuron_test";
const FALLBACK_TEST_DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${DEFAULT_TEST_DB_NAME}`;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const MOCKED_SERVICE_ENV_DEFAULTS: Record<string, string> = {
  NODE_ENV: "test",
  NEURON_BASE_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "test-only-better-auth-secret-32chars",
  REDIS_URL: "redis://localhost:6379/0",
  MINIO_ROOT_USER: "testadmin",
  MINIO_ROOT_PASSWORD: "testpassword",
  MINIO_HOST: "localhost",
  MINIO_PORT: "9000",
  MINIO_BUCKET: "neuron-test",
  MINIO_USE_SSL: "false",
  FILES_BASE_URL: "http://localhost:9000",
  FILES_BUCKET: "neuron-test",
  SENTRY_DSN: "http://placeholder@localhost:8000/1",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_USER: "test",
  SMTP_PASS: "test",
  MAIL_FROM: "Test <test@neuron.test>",
};

function readEnvFile(filePath: string): Record<string, string> {
  return fs.existsSync(filePath)
    ? parse(fs.readFileSync(filePath, "utf8"))
    : {};
}

const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

function deriveLocalTestDbUrl(rawUrl?: string): string | undefined {
  if (!rawUrl?.trim()) return undefined;
  try {
    const url = new URL(rawUrl);
    if (!POSTGRES_PROTOCOLS.has(url.protocol)) return undefined;
    if (!LOOPBACK_HOSTS.has(url.hostname.toLowerCase())) return undefined;
    if (url.searchParams.has("host")) return undefined;
    url.pathname = `/${DEFAULT_TEST_DB_NAME}`;
    url.searchParams.delete("database");
    return url.toString();
  } catch {
    return undefined;
  }
}

/**
 * Resolves test environment variables without inheriting a shell's `DATABASE_URL`
 * (preventing accidental resets of a dev/prod database).
 *
 * `DATABASE_URL` precedence:
 * 1. `process.env.TEST_DATABASE_URL` (CI or explicit CLI override)
 * 2. `.env.test.local` (`TEST_DATABASE_URL` or `DATABASE_URL`, gitignored)
 * 3. Loopback `.env` `DATABASE_URL` retargeted to `/neuron_test`
 * 4. `postgresql://postgres:postgres@localhost:5432/neuron_test`
 */
export function resolveTestEnv(rootDir: string): Record<string, string> {
  const { TEST_DATABASE_URL: localTestDatabaseUrl, ...restLocalTestEnv } =
    readEnvFile(path.join(rootDir, ".env.test.local"));
  const nonEmptyLocalTestEnv = Object.fromEntries(
    Object.entries(restLocalTestEnv).filter(([, value]) => value.trim() !== ""),
  );
  const devEnv = readEnvFile(path.join(rootDir, ".env"));

  const databaseUrl =
    [
      process.env.TEST_DATABASE_URL,
      localTestDatabaseUrl,
      nonEmptyLocalTestEnv.DATABASE_URL,
      deriveLocalTestDbUrl(devEnv.DATABASE_URL),
    ]
      .find((v) => v?.trim())
      ?.trim() ?? FALLBACK_TEST_DATABASE_URL;

  return {
    ...MOCKED_SERVICE_ENV_DEFAULTS,
    ...nonEmptyLocalTestEnv,
    NODE_ENV: "test",
    DATABASE_URL: databaseUrl,
  };
}
