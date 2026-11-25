import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveTestEnv } from "../test-env";

describe("resolveTestEnv", () => {
  const tempDirs: string[] = [];

  function makeTempRoot(files: Record<string, string> = {}): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "neuron-test-env-"));
    tempDirs.push(dir);
    for (const [name, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(dir, name), content);
    }
    return dir;
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("ignores a shell DATABASE_URL and falls back to the default local test DB", () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://prod:secret@db.prod.internal/prod",
    );
    vi.stubEnv("TEST_DATABASE_URL", "");

    const resolved = resolveTestEnv(makeTempRoot());

    expect(resolved.DATABASE_URL).toBe(
      "postgresql://postgres:postgres@localhost:5432/neuron_test",
    );
    expect(resolved.NODE_ENV).toBe("test");
  });

  it("retargets loopback .env DATABASE_URL to /neuron_test and strips ?database", () => {
    vi.stubEnv("TEST_DATABASE_URL", "");
    const root = makeTempRoot({
      ".env":
        "DATABASE_URL=postgresql://postgres:devpass@127.0.0.1:5433/neuron?database=neuron&sslmode=disable\n",
    });

    const resolved = resolveTestEnv(root);

    expect(resolved.DATABASE_URL).toBe(
      "postgresql://postgres:devpass@127.0.0.1:5433/neuron_test?sslmode=disable",
    );
  });

  it("ignores remote, non-postgres, or ?host-overridden .env DATABASE_URLs", () => {
    vi.stubEnv("TEST_DATABASE_URL", "");
    const cases = [
      "postgresql://postgres:pass@db.staging.example.com:5432/neuron",
      "http://localhost:5432/neuron",
      "postgresql://postgres:pass@localhost:5432/neuron?host=db.remote.example.com",
    ];

    for (const rawUrl of cases) {
      const root = makeTempRoot({ ".env": `DATABASE_URL=${rawUrl}\n` });
      expect(resolveTestEnv(root).DATABASE_URL).toBe(
        "postgresql://postgres:postgres@localhost:5432/neuron_test",
      );
    }
  });

  it("skips blank .env.test.local overrides while keeping non-empty values", () => {
    vi.stubEnv("TEST_DATABASE_URL", "");
    const root = makeTempRoot({
      ".env.test.local": [
        "TEST_DATABASE_URL=",
        "BETTER_AUTH_SECRET=   ",
        "DATABASE_URL=postgresql://postgres:local@localhost:5432/custom_test",
        "SMTP_HOST=mailhog.local",
      ].join("\n"),
    });

    const resolved = resolveTestEnv(root);

    expect(resolved.DATABASE_URL).toBe(
      "postgresql://postgres:local@localhost:5432/custom_test",
    );
    expect(resolved.BETTER_AUTH_SECRET).toBe(
      "test-only-better-auth-secret-32chars",
    );
    expect(resolved.SMTP_HOST).toBe("mailhog.local");
  });

  it("preserves CLI TEST_DATABASE_URL precedence across repeated calls", () => {
    vi.stubEnv(
      "TEST_DATABASE_URL",
      "postgresql://cli:pass@localhost:5432/cli_test",
    );
    const root = makeTempRoot({
      ".env.test.local":
        "TEST_DATABASE_URL=postgresql://local:pass@localhost:5432/file_test\n",
    });

    const first = resolveTestEnv(root);
    Object.assign(process.env, first);
    const second = resolveTestEnv(root);

    expect(first.DATABASE_URL).toBe(
      "postgresql://cli:pass@localhost:5432/cli_test",
    );
    expect(second.DATABASE_URL).toBe(
      "postgresql://cli:pass@localhost:5432/cli_test",
    );
    expect("TEST_DATABASE_URL" in first).toBe(false);
  });
});

describe("resetDatabase safety guard", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("rejects non-_test databases and closes the connection before dropping schemas", async () => {
    const execute = vi.fn().mockResolvedValueOnce([{ db: "neuron" }]);
    const end = vi.fn().mockResolvedValue(undefined);

    vi.doMock("postgres", () => ({
      default: vi.fn(() => ({ end })),
    }));
    vi.doMock("drizzle-orm/postgres-js", () => ({
      drizzle: vi.fn(() => ({ execute })),
    }));

    const { resetDatabase } = await import("../test-db");

    await expect(resetDatabase()).rejects.toThrow(
      'Refusing to reset database "neuron"',
    );
    expect(execute).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledTimes(1);
  });
});
