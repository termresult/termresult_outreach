import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { emptyContact } from "../types/contact.ts";
import { adminDb } from "../lib/firebase/admin.ts";

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
    process.env[key] = value;
  }
}

loadEnvLocal();

const id = "seed-dummy-regent";
const contact = emptyContact(id);
contact.name = "Dummy seed school";
contact.area = "Maitama";
contact.imported_at = new Date().toISOString();
contact.updated_at = contact.imported_at;

await adminDb().collection("contacts").doc(id).set(contact);
console.log(`wrote contacts/${id}`);
