import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Campaign } from "@/types/campaign";
import type { Message, Suppression } from "@/types/message";

const DATA_PATH = resolve(process.cwd(), ".data/outreach.json");

type OutreachFile = {
  campaigns: Record<string, Campaign>;
  messages: Record<string, Message>;
  suppressions: Suppression[];
};

function emptyFile(): OutreachFile {
  return { campaigns: {}, messages: {}, suppressions: [] };
}

function readFile(): OutreachFile {
  try {
    return JSON.parse(readFileSync(DATA_PATH, "utf8")) as OutreachFile;
  } catch {
    return emptyFile();
  }
}

function writeFile(file: OutreachFile) {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, `${JSON.stringify(file)}\n`, "utf8");
}

export function listCampaigns(): Campaign[] {
  return Object.values(readFile().campaigns).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getCampaign(id: string): Campaign | null {
  return readFile().campaigns[id] ?? null;
}

export function saveCampaign(campaign: Campaign): Campaign {
  const file = readFile();
  file.campaigns[campaign.id] = campaign;
  writeFile(file);
  return campaign;
}

export function listMessages(campaignId?: string): Message[] {
  const rows = Object.values(readFile().messages);
  const filtered = campaignId ? rows.filter((row) => row.campaign_id === campaignId) : rows;
  return filtered.sort((a, b) => (b.attempted_at ?? b.id).localeCompare(a.attempted_at ?? a.id));
}

export function listSuppressions(): Suppression[] {
  return readFile().suppressions;
}

export function upsertMessages(incoming: Message[]): { created: number; skipped: number } {
  const file = readFile();
  let created = 0;
  let skipped = 0;
  for (const row of incoming) {
    if (file.messages[row.idempotency_key]) {
      skipped += 1;
      continue;
    }
    file.messages[row.idempotency_key] = row;
    created += 1;
  }
  writeFile(file);
  return { created, skipped };
}

export function replaceMessages(incoming: Message[]) {
  const file = readFile();
  for (const row of incoming) {
    file.messages[row.idempotency_key] = row;
  }
  writeFile(file);
}

export function campaignCount(): number {
  return Object.keys(readFile().campaigns).length;
}

export function addSuppression(row: Suppression): Suppression {
  const file = readFile();
  const exists = file.suppressions.some(
    (item) => item.address === row.address && item.channel === row.channel,
  );
  if (!exists) {
    file.suppressions.push(row);
    writeFile(file);
  }
  return row;
}

export function findMessageByProviderId(providerId: string): Message | null {
  return Object.values(readFile().messages).find((row) => row.provider_id === providerId) ?? null;
}

export function patchMessage(idempotencyKey: string, patch: Partial<Message>): Message | null {
  const file = readFile();
  const current = file.messages[idempotencyKey];
  if (!current) return null;
  file.messages[idempotencyKey] = { ...current, ...patch };
  writeFile(file);
  return file.messages[idempotencyKey];
}
