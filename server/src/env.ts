import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Prevent local test requests / superagent from routing through explicit proxy
delete process.env.HTTP_PROXY;
delete process.env.http_proxy;
delete process.env.HTTPS_PROXY;
delete process.env.https_proxy;
delete process.env.ALL_PROXY;
delete process.env.all_proxy;
process.env.NO_PROXY = "*";
process.env.no_proxy = "*";

// Locate .env candidate paths (cwd, server/.env, parent .env)
const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "server", ".env"),
  path.resolve(process.cwd(), "..", ".env"),
  path.resolve(process.cwd(), "..", "server", ".env"),
];

for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

// Fallback to default dotenv lookup
dotenv.config();

// Safe fallback for JWT_SECRET strictly during automated testing (vitest sets NODE_ENV=test)
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "test") {
  process.env.JWT_SECRET = "supersecretdevkey";
}

