import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { OutreachContact } from "@/types/contact";
import { mergeContact } from "@/lib/import/map-contact";

const DATA_PATH = resolve(process.cwd(), ".data/contacts.json");

export type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  invalid: number;
  with_phone: number;
  with_email: number;
  total: number;
};

type StoreFile = {
  contacts: Record<string, OutreachContact>;
};

function readStore(): StoreFile {
  try {
    return JSON.parse(readFileSync(DATA_PATH, "utf8")) as StoreFile;
  } catch {
    return { contacts: {} };
  }
}

function writeStore(store: StoreFile) {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, `${JSON.stringify(store)}\n`, "utf8");
}

export function listContacts(): OutreachContact[] {
  return Object.values(readStore().contacts);
}

export function getContact(id: string): OutreachContact | null {
  return readStore().contacts[id] ?? null;
}

export function contactStats() {
  const contacts = listContacts();
  return {
    schools: contacts.length,
    with_phone: contacts.filter((c) => c.phone_e164).length,
    with_email: contacts.filter((c) => c.email).length,
  };
}

export function upsertContacts(incoming: OutreachContact[]): ImportSummary {
  const store = readStore();
  const now = new Date().toISOString();
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let invalid = 0;

  for (const row of incoming) {
    if (!row.source_place_id || !row.name) {
      invalid += 1;
      continue;
    }
    const existing = store.contacts[row.id];
    if (existing) {
      store.contacts[row.id] = mergeContact(existing, row, now);
      updated += 1;
    } else {
      store.contacts[row.id] = mergeContact(undefined, row, now);
      created += 1;
    }
  }

  writeStore(store);
  const contacts = Object.values(store.contacts);
  return {
    created,
    updated,
    skipped,
    invalid,
    with_phone: contacts.filter((c) => c.phone_e164).length,
    with_email: contacts.filter((c) => c.email).length,
    total: contacts.length,
  };
}
