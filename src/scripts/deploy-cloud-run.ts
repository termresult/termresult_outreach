import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

const PROJECT = "termresult-outreach";
const SERVICE = "termresult-outreach";
const REGION = "us-central1";

const PASS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "ALLOWLIST_EMAILS",
  "OUTREACH_MOCK_AUTH",
] as const;

const PUBLIC_ENV = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) throw new Error("missing .env.local");
  const env: Record<string, string> = {};
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const cut = line.indexOf("=");
    if (cut < 1) continue;
    let value = line.slice(cut + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[line.slice(0, cut)] = value.replaceAll("\\n", "\n");
  }
  return env;
}

function yamlEscape(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n")}"`;
}

const env = loadEnvLocal();
for (const name of PASS) {
  if (!env[name]) throw new Error(`missing ${name} in .env.local`);
}

const publicFile = resolve(process.cwd(), ".env.production");
writeFileSync(publicFile, `${PUBLIC_ENV.map((name) => `${name}=${env[name]}`).join("\n")}\n`, "utf8");

const file = resolve(tmpdir(), `tr-run-env-${randomBytes(6).toString("hex")}.yaml`);
writeFileSync(file, `${PASS.map((name) => `${name}: ${yamlEscape(env[name])}`).join("\n")}\n`, "utf8");

try {
  const result = spawnSync(
    "gcloud",
    [
      "run",
      "deploy",
      SERVICE,
      "--source",
      ".",
      "--account=officialtermresult@gmail.com",
      `--project=${PROJECT}`,
      `--region=${REGION}`,
      "--allow-unauthenticated",
      `--env-vars-file=${file}`,
      "--quiet",
    ],
    { encoding: "utf8", shell: true, stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error("gcloud run deploy failed");
  }
} finally {
  unlinkSync(file);
  if (existsSync(publicFile)) unlinkSync(publicFile);
}
