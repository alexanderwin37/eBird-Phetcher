import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { EnvConfig } from "./types.js";

const ENV_PATH = join(import.meta.dirname, "..", ".env");

export function loadEnv(): EnvConfig {
  if (!existsSync(ENV_PATH)) {
    console.error("Missing .env file. Create one with:\n  USER_AGENT=...\n  EBIRD_COOKIE=...");
    process.exit(1);
  }
  const env = readFileSync(ENV_PATH, "utf-8");
  const cookieMatch = env.match(/^EBIRD_COOKIE=(.+)$/m);
  if (!cookieMatch?.[1]) {
    console.error("EBIRD_COOKIE not found in .env file.");
    process.exit(1);
  }
  const uaMatch = env.match(/^USER_AGENT=(.+)$/m);
  if (!uaMatch?.[1]) {
    console.error("USER_AGENT not found in .env file.");
    process.exit(1);
  }
  return { cookie: cookieMatch[1].trim(), userAgent: uaMatch[1].trim() };
}
