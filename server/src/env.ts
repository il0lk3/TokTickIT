import dotenv from "dotenv";
import path from "path";
import fs from "fs";

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

// Safe fallback for JWT_SECRET in development/test when omitted
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "production") {
  process.env.JWT_SECRET = "supersecretdevkey";
}
