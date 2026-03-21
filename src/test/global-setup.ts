import { resetDatabase, closeDatabase } from "./test-db";

export async function setup() {
  await resetDatabase();
}

export async function teardown() {
  await closeDatabase();
}
