import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { adminDb } from "../lib/firebase/admin";
import type { OutreachContact } from "../types/contact";
import type { Campaign } from "../types/campaign";
import type { Message, Suppression } from "../types/message";
import { suppressionId } from "../lib/store/outreach";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const cut = line.indexOf("=");
    if (cut < 1) continue;
    const key = line.slice(0, cut).trim();
    let value = line.slice(cut + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function readJson<T>(relative: string): T | null {
  const path = resolve(process.cwd(), relative);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

async function writeBatch(rows: Array<{ col: string; id: string; data: object }>) {
  const db = adminDb();
  for (let i = 0; i < rows.length; i += 400) {
    const batch = db.batch();
    for (const row of rows.slice(i, i + 400)) {
      if (!row.id) throw new Error(`Refusing to invent an id for ${row.col}`);
      batch.set(db.collection(row.col).doc(row.id), row.data);
    }
    await batch.commit();
    console.log(`wrote ${Math.min(i + 400, rows.length)} / ${rows.length}`);
  }
}

async function main() {
  loadEnvLocal();
  const contactsFile = readJson<{ contacts: Record<string, OutreachContact> }>(".data/contacts.json");
  const outreachFile = readJson<{
    campaigns: Record<string, Campaign>;
    messages: Record<string, Message>;
    suppressions: Suppression[];
  }>(".data/outreach.json");
  const settingsFile = readJson<{ test_phone?: string; test_email?: string }>(".data/settings.json");

  const contacts = Object.values(contactsFile?.contacts ?? {});
  if (!contacts.length) {
    throw new Error("No contacts in .data/contacts.json");
  }
  for (const row of contacts) {
    if (!row.id || !row.source_place_id) {
      throw new Error("Refusing to invent school ids.");
    }
  }

  await writeBatch(contacts.map((row) => ({ col: "contacts", id: row.id, data: row })));

  const campaigns = Object.values(outreachFile?.campaigns ?? {});
  const messages = Object.values(outreachFile?.messages ?? {});
  const suppressions = outreachFile?.suppressions ?? [];
  if (campaigns.length) {
    await writeBatch(campaigns.map((row) => ({ col: "campaigns", id: row.id, data: row })));
  }
  if (messages.length) {
    await writeBatch(messages.map((row) => ({ col: "messages", id: row.idempotency_key, data: row })));
  }
  if (suppressions.length) {
    await writeBatch(suppressions.map((row) => ({ col: "suppressions", id: suppressionId(row), data: row })));
  }
  if (settingsFile) {
    await adminDb().collection("settings").doc("app").set({
      test_phone: settingsFile.test_phone ?? "",
      test_email: settingsFile.test_email ?? "",
    });
  }

  const snap = await adminDb().collection("contacts").get();
  const stored = snap.docs.map((doc) => doc.data() as OutreachContact);
  const withEmail = stored.filter((row) => row.email).length;
  const summary = {
    contacts_written: contacts.length,
    contacts_in_firestore: stored.length,
    with_email: withEmail,
    campaigns_written: campaigns.length,
    messages_written: messages.length,
    suppressions_written: suppressions.length,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (stored.length !== contacts.length) {
    throw new Error(`Count mismatch: wrote ${contacts.length}, firestore has ${stored.length}`);
  }
}

void main();
