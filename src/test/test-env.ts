import fs from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

const DEFAULT_TEST_DB_NAME = "neuron_test";
const FALLBACK_TEST_DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${DEFAULT_TEST_DB_NAME}`;

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

function readEnvFileIfExists(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  return parse(fs.readFileSync(filePath, "utf8"));
}

function deriveLocalTestDbUrl(devEnv: Record<string, string>): string | null {
  if (devEnv.DATABASE_URL) {
    try {
      const url = new URL(devEnv.DATABASE_URL);
      url.pathname = `/${DEFAULT_TEST_DB_NAME}`;
      return url.toString();
    } catch {
      // Fall through to password/port derivation
    }
  }

  if (devEnv.DATABASE_PASSWORD) {
    const port = devEnv.DB_PORT ?? "5432";
    const password = encodeURIComponent(devEnv.DATABASE_PASSWORD);
    return `postgresql://postgres:${password}@localhost:${port}/${DEFAULT_TEST_DB_NAME}`;
  }

  return null;
}

/**
 * Resolves test environment variables without inheriting a shell's `DATABASE_URL`
 * (preventing accidental resets of a dev/prod database).
 *
 * `DATABASE_URL` precedence:
 * 1. `process.env.TEST_DATABASE_URL` (CI or explicit CLI override)
 * 2. `.env.test.local` (`TEST_DATABASE_URL` or `DATABASE_URL`, gitignored)
 * 3. Local `.env` credentials retargeted to `/neuron_test`
 * 4. `postgresql://postgres:postgres@localhost:5432/neuron_test`
 */
export function resolveTestEnv(rootDir: string): Record<string, string> {
  const localTestEnv = readEnvFileIfExists(
    path.join(rootDir, ".env.test.local"),
  );
  const devEnv = readEnvFileIfExists(path.join(rootDir, ".env"));

  const databaseUrl =
    process.env.TEST_DATABASE_URL ??
    localTestEnv.TEST_DATABASE_URL ??
    localTestEnv.DATABASE_URL ??
    deriveLocalTestDbUrl(devEnv) ??
    FALLBACK_TEST_DATABASE_URL;

  return {
    ...MOCKED_SERVICE_ENV_DEFAULTS,
    ...localTestEnv,
    NODE_ENV: "test",
    DATABASE_URL: databaseUrl,
  };
}
