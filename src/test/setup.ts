import { beforeEach, afterAll } from "vitest";
import { resetDatabase, closeDatabase } from "./test-db";

beforeEach(async () => {
  // Reset database state before each test
  await resetDatabase();
});

afterAll(async () => {
  await closeDatabase();
});
