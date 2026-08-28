import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REGISTRATION_ROWS, asSeedInput } from "../lib/proprietors/registration-list";
import {
  clearUnsavedTalkState,
  deleteCollapsedRegistrationRows,
  upsertSeededProprietor,
} from "../lib/store/proprietors";

function loadEnvLocal() {
  const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const cut = line.indexOf("=");
    if (cut < 1) continue;
    const key = line.slice(0, cut).trim();
    let value = line.slice(cut + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[key] = value.replaceAll("\\n", "\n");
  }
}

loadEnvLocal();

async function main() {
  let created = 0;
  let skipped = 0;

  for (const row of REGISTRATION_ROWS) {
    const result = await upsertSeededProprietor(row.sn, asSeedInput(row));
    if (result.created) created += 1;
    else skipped += 1;
  }

  const removed = await deleteCollapsedRegistrationRows();
  const cleared = await clearUnsavedTalkState();
  console.log(
    `seeded proprietors created=${created} already_there=${skipped} total=${REGISTRATION_ROWS.length} removed_old=${removed} cleared_unsaved=${cleared}`,
  );
}

void main();
