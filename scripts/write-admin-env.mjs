import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const key = JSON.parse(readFileSync(resolve(root, ".secrets/outreach-app.json"), "utf8"));
const envPath = resolve(root, ".env.local");
const current = readFileSync(envPath, "utf8");

const escapedKey = key.private_key.replaceAll("\n", "\\n");
const next = current
  .replace(/^FIREBASE_ADMIN_CLIENT_EMAIL=.*$/m, `FIREBASE_ADMIN_CLIENT_EMAIL=${key.client_email}`)
  .replace(/^FIREBASE_ADMIN_PRIVATE_KEY=.*$/m, `FIREBASE_ADMIN_PRIVATE_KEY="${escapedKey}"`);

if (next.includes("FIREBASE_ADMIN_CLIENT_EMAIL=\n") || next.includes("FIREBASE_ADMIN_PRIVATE_KEY=\n")) {
  throw new Error("Failed to fill admin env fields.");
}

writeFileSync(envPath, next);
console.log("Wrote FIREBASE_ADMIN_* into .env.local");
