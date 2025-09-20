import { readFileSync } from "fs";

export function readSecretFromFile(file: string) {
  try {
    // Read the secret from the file created by Docker secrets and trim any whitespace/newlines.
    return readFileSync(file, { encoding: "utf8" }).trim();
  } catch {
    console.error("Error reading secret from file");
    process.exit(1);
  }
}
