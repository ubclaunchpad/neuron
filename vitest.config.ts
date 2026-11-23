import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import path from "path";

// Load environment variables from .env.test (existing env vars take precedence)
config({ path: ".env.test" });

export default defineConfig({
  test: {
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
