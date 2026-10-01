import type { DocumentData } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { memoryStore, useMemoryStore } from "@/lib/store/memory";
import { emptySendCursor, type Campaign } from "@/types/campaign";
import type { Message, MessageStatus, Suppression } from "@/types/message";

export function suppressionId(row: Pick<Suppression, "address" | "channel">): string {
  return `${row.address}__${row.channel}`.replaceAll("/", "_");
}

function asCampaign(id: string, data: DocumentData | undefined): Campaign | null {
  if (!data) return null;
  const campaign = { ...(data as Campaign), id: (data.id as string) || id };
  campaign.send_cursor = campaign.send_cursor ?? emptySendCursor();
  return campaign;
}

function asMessage(id: string, data: DocumentData | undefined): Message | null {
  if (!data) return null;
  return { ...(data as Message), id: (data.id as string) || id };
}

export async function listCampaigns(): Promise<Campaign[]> {
  if (useMemoryStore()) {
    return Object.values(memoryStore().campaigns).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const snap = await adminDb().collection("campaigns").get();
  return snap.docs
    .map((doc) => asCampaign(doc.id, doc.data())!)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  if (useMemoryStore()) return memoryStore().campaigns[id] ?? null;
  const snap = await adminDb().collection("campaigns").doc(id).get();
  return asCampaign(id, snap.data());
}

export async function saveCampaign(campaign: Campaign): Promise<Campaign> {
  if (useMemoryStore()) {
    memoryStore().campaigns[campaign.id] = campaign;
    return campaign;
  }
  await adminDb().collection("campaigns").doc(campaign.id).set(campaign);
  return campaign;
}

export async function nextQueuedMessage(campaignId: string): Promise<Message | null> {
  if (useMemoryStore()) {
    return (
      Object.values(memoryStore().messages)
        .filter((row) => row.campaign_id === campaignId && row.status === "queued")
        .sort((a, b) => a.id.localeCompare(b.id))[0] ?? null
    );
  }
  const snap = await adminDb()
    .collection("messages")
    .where("campaign_id", "==", campaignId)
    .where("status", "==", "queued")
    .orderBy("id")
    .limit(1)
    .get();
  const doc = snap.docs[0];
  return doc ? asMessage(doc.id, doc.data()) : null;
}

export async function countMessagesByStatus(campaignId: string, status: MessageStatus): Promise<number> {
  if (useMemoryStore()) {
    return Object.values(memoryStore().messages).filter(
      (row) => row.campaign_id === campaignId && row.status === status,
    ).length;
  }
  const snap = await adminDb()
    .collection("messages")
    .where("campaign_id", "==", campaignId)
    .where("status", "==", status)
    .count()
    .get();
  return snap.data().count;
}

export async function listRunningEmailCampaigns(): Promise<Campaign[]> {
  if (useMemoryStore()) {
    return Object.values(memoryStore().campaigns).filter(
      (row) => row.channel === "email" && row.status === "running",
    );
  }
  const snap = await adminDb()
    .collection("campaigns")
    .where("channel", "==", "email")
    .where("status", "==", "running")
    .get();
  return snap.docs.map((doc) => asCampaign(doc.id, doc.data())!).filter(Boolean);
}

export async function listMessages(campaignId?: string): Promise<Message[]> {
  if (useMemoryStore()) {
    const rows = Object.values(memoryStore().messages);
    const filtered = campaignId ? rows.filter((row) => row.campaign_id === campaignId) : rows;
    return filtered.sort((a, b) => (b.attempted_at ?? b.id).localeCompare(a.attempted_at ?? a.id));
  }
  const col = adminDb().collection("messages");
  const snap = campaignId ? await col.where("campaign_id", "==", campaignId).get() : await col.get();
  return snap.docs
    .map((doc) => asMessage(doc.id, doc.data())!)
    .sort((a, b) => (b.attempted_at ?? b.id).localeCompare(a.attempted_at ?? a.id));
}

export async function listSuppressions(): Promise<Suppression[]> {
  if (useMemoryStore()) return [...memoryStore().suppressions];
  const snap = await adminDb().collection("suppressions").get();
  return snap.docs.map((doc) => doc.data() as Suppression);
}

export async function upsertMessages(incoming: Message[]): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;
  const toWrite: Message[] = [];
  for (const row of incoming) {
    const existing = useMemoryStore()
      ? memoryStore().messages[row.idempotency_key]
      : (await adminDb().collection("messages").doc(row.idempotency_key).get()).data();
    if (existing) {
      skipped += 1;
      continue;
    }
    toWrite.push(row);
    created += 1;
  }
  await replaceMessages(toWrite);
  return { created, skipped };
}

export async function replaceMessages(incoming: Message[]) {
  if (!incoming.length) return;
  if (useMemoryStore()) {
    const store = memoryStore();
    for (const row of incoming) store.messages[row.idempotency_key] = row;
    return;
  }
  const db = adminDb();
  for (let i = 0; i < incoming.length; i += 400) {
    const batch = db.batch();
    for (const row of incoming.slice(i, i + 400)) {
      batch.set(db.collection("messages").doc(row.idempotency_key), row);
    }
    await batch.commit();
  }
}

export async function campaignCount(): Promise<number> {
  if (useMemoryStore()) return Object.keys(memoryStore().campaigns).length;
  const snap = await adminDb().collection("campaigns").count().get();
  return snap.data().count;
}

export async function addSuppression(row: Suppression): Promise<Suppression> {
  if (useMemoryStore()) {
    const store = memoryStore();
    const exists = store.suppressions.some(
      (item) => item.address === row.address && item.channel === row.channel,
    );
    if (!exists) store.suppressions.push(row);
    return row;
  }
  await adminDb().collection("suppressions").doc(suppressionId(row)).set(row, { merge: true });
  return row;
}

export async function findMessageByProviderId(providerId: string): Promise<Message | null> {
  if (useMemoryStore()) {
    return Object.values(memoryStore().messages).find((row) => row.provider_id === providerId) ?? null;
  }
  const snap = await adminDb().collection("messages").where("provider_id", "==", providerId).limit(1).get();
  const doc = snap.docs[0];
  return doc ? asMessage(doc.id, doc.data()) : null;
}

export async function patchMessage(idempotencyKey: string, patch: Partial<Message>): Promise<Message | null> {
  if (useMemoryStore()) {
    const current = memoryStore().messages[idempotencyKey];
    if (!current) return null;
    memoryStore().messages[idempotencyKey] = { ...current, ...patch };
    return memoryStore().messages[idempotencyKey];
  }
  const ref = adminDb().collection("messages").doc(idempotencyKey);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const next = { ...(snap.data() as Message), ...patch };
  await ref.set(next);
  return next;
}
