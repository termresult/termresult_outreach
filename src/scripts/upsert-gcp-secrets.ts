import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

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
    env[line.slice(0, cut)] = value;
  }
  return env;
}

function gcloud(args: string[], input?: string) {
  const result = spawnSync("gcloud", args, {
    encoding: "utf8",
    shell: true,
    input,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `gcloud failed: ${args.join(" ")}`);
  }
  return result.stdout;
}

function upsertSecret(name: string, value: string) {
  const file = resolve(tmpdir(), `tr-secret-${randomBytes(6).toString("hex")}`);
  writeFileSync(file, value, "utf8");
  try {
    const exists = spawnSync("gcloud", ["secrets", "describe", name, "--project=termresult-outreach"], {
      encoding: "utf8",
      shell: true,
    });
    if (exists.status === 0) {
      gcloud(["secrets", "versions", "add", name, `--data-file=${file}`, "--project=termresult-outreach"]);
      console.log(`updated ${name}`);
    } else {
      gcloud(["secrets", "create", name, `--data-file=${file}`, "--project=termresult-outreach"]);
      console.log(`created ${name}`);
    }
  } finally {
    unlinkSync(file);
  }
}

const env = loadEnvLocal();
const mapping: Record<string, string> = {
  "termresult-firebase-admin-key": env.FIREBASE_ADMIN_PRIVATE_KEY,
  "termresult-gmail-client-secret": env.GOOGLE_GMAIL_CLIENT_SECRET,
  "termresult-gmail-refresh-token": env.GOOGLE_GMAIL_REFRESH_TOKEN,
  "termresult-cron-secret": env.CRON_SECRET,
};

for (const [name, value] of Object.entries(mapping)) {
  if (!value) throw new Error(`missing value for ${name}`);
  upsertSecret(name, value);
}

const runtimeSa = "219195820109-compute@developer.gserviceaccount.com";
for (const name of Object.keys(mapping)) {
  spawnSync(
    "gcloud",
    [
      "secrets",
      "add-iam-policy-binding",
      name,
      `--member=serviceAccount:${runtimeSa}`,
      "--role=roles/secretmanager.secretAccessor",
      "--project=termresult-outreach",
      "--quiet",
    ],
    { encoding: "utf8", shell: true },
  );
  console.log(`granted accessor on ${name}`);
}
