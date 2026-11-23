import { defineConfig } from "vitest/config";
import path from "path";
import { resolveTestEnv } from "./src/test/test-env";

const testEnv = resolveTestEnv(__dirname);

// Apply resolved test env in the main process (for globalSetup) as well as workers
Object.assign(process.env, testEnv);

export default defineConfig({
  // Prevent Vite from auto-loading `.env` (dev DB) when `.env.test` is absent
  envDir: false,
  test: {
    env: testEnv,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/server/**/*.ts"],
      exclude: [
        "src/server/db/migrations/**",
        "src/server/db/schema/**",
        "**/*.test.ts",
      ],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          globals: true,
          environment: "node",
          include: ["src/test/unit/**/*.test.ts"],
          exclude: ["node_modules", ".next"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          globals: true,
          environment: "node",
          globalSetup: ["./src/test/global-setup.ts"],
          include: ["src/test/integration/**/*.test.ts"],
          exclude: ["node_modules", ".next"],
          // Run integration tests sequentially to avoid database conflicts
          sequence: {
            concurrent: false,
          },
          fileParallelism: false,
          testTimeout: 30000,
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@public": path.resolve(__dirname, "./public"),
    },
  },
});
