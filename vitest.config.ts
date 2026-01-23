import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import path from "path";

// Load environment variables from .env.test
config({ path: ".env.test" });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/test/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
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
    // Run tests sequentially to avoid database conflicts
    sequence: {
      concurrent: false,
    },
    fileParallelism: false,
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@public": path.resolve(__dirname, "./public"),
    },
  },
});
