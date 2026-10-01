import type { DocumentData } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { mergeContact } from "@/lib/import/map-contact";
import { memoryStore, useMemoryStore } from "@/lib/store/memory";
import type { OutreachContact } from "@/types/contact";

export type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  invalid: number;
  with_phone: number;
  with_email: number;
  total: number;
};

function asContact(id: string, data: DocumentData | undefined): OutreachContact | null {
  if (!data) return null;
  return { ...(data as OutreachContact), id: (data.id as string) || id };
}

export async function listContacts(): Promise<OutreachContact[]> {
  if (useMemoryStore()) return Object.values(memoryStore().contacts);
  const snap = await adminDb().collection("contacts").get();
  return snap.docs.map((doc) => asContact(doc.id, doc.data())!).filter(Boolean);
}

export async function getContact(id: string): Promise<OutreachContact | null> {
  if (useMemoryStore()) return memoryStore().contacts[id] ?? null;
  const snap = await adminDb().collection("contacts").doc(id).get();
  return asContact(id, snap.data());
}

export async function contactStats() {
  const contacts = await listContacts();
  return {
    schools: contacts.length,
    with_phone: contacts.filter((c) => c.phone_e164).length,
    with_email: contacts.filter((c) => c.email).length,
  };
}

export async function upsertContacts(incoming: OutreachContact[]): Promise<ImportSummary> {
  const now = new Date().toISOString();
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let invalid = 0;
  const written: OutreachContact[] = [];

  for (const row of incoming) {
    if (!row.source_place_id || !row.name) {
      invalid += 1;
      continue;
    }
    const existing = await getContact(row.id);
    const next = mergeContact(existing ?? undefined, row, now);
    written.push(next);
    if (existing) updated += 1;
    else created += 1;
  }

  if (useMemoryStore()) {
    const store = memoryStore();
    for (const row of written) store.contacts[row.id] = row;
  } else if (written.length) {
    const db = adminDb();
    for (let i = 0; i < written.length; i += 400) {
      const batch = db.batch();
      for (const row of written.slice(i, i + 400)) {
        batch.set(db.collection("contacts").doc(row.id), row);
      }
      await batch.commit();
    }
  }

  const contacts = await listContacts();
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
