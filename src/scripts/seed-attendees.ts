import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ATTENDEE_SEED_ROWS } from "../lib/attendees/seed-data";
import { upsertSeedAttendee } from "../lib/store/attendees";

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
  let preserved = 0;

  for (const row of ATTENDEE_SEED_ROWS) {
    const result = await upsertSeedAttendee(row);
    if (result.created) created += 1;
    else preserved += 1;
  }

  console.log(
    `seeded attendees created=${created} preserved_existing=${preserved} total=${ATTENDEE_SEED_ROWS.length}`,
  );
}

void main();
