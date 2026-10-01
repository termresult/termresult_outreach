import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { emptySendCursor } from "../types/campaign";
import { lagosDateKey } from "../lib/send/throttle";
import { getCampaign, listMessages, saveCampaign } from "../lib/store/outreach";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) throw new Error("missing .env.local");
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const cut = line.indexOf("=");
    if (cut < 1) continue;
    const key = line.slice(0, cut).trim();
    let value = line.slice(cut + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();
  const id = "camp_mt6hvad8";
  const campaign = await getCampaign(id);
  if (!campaign) throw new Error(`Campaign ${id} not found.`);

  const messages = await listMessages(id);
  const sent = messages.filter((row) => row.status === "sent");
  const failed = messages.filter((row) => row.status === "failed");
  const queued = messages.filter((row) => row.status === "queued");
  const last = sent
    .map((row) => row.completed_at)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;
  const day = lagosDateKey(new Date());

  campaign.status = "paused";
  campaign.send_cursor = {
    ...(campaign.send_cursor ?? emptySendCursor()),
    last_email_at: last,
    send_day: day,
    sent_today: sent.length,
    queued_left: queued.length,
  };
  await saveCampaign(campaign);

  console.log(
    JSON.stringify(
      {
        campaign_id: id,
        status: campaign.status,
        send_cursor: campaign.send_cursor,
        sent: sent.map((row) => row.to),
        failed: failed.map((row) => ({ to: row.to, error: row.error })),
      },
      null,
      2,
    ),
  );
}

void main();
