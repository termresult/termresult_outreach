import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
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

  const previous = campaign.status;
  campaign.status = "paused";
  await saveCampaign(campaign);

  const messages = await listMessages(id);
  const counts = {
    queued: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    sending: 0,
  };
  const sentTo: string[] = [];
  for (const row of messages) {
    if (row.status === "queued") counts.queued += 1;
    else if (row.status === "sent") {
      counts.sent += 1;
      if (row.to) sentTo.push(row.to);
    } else if (row.status === "failed") counts.failed += 1;
    else if (row.status === "skipped") counts.skipped += 1;
    else if (row.status === "sending") counts.sending += 1;
  }

  console.log(
    JSON.stringify(
      {
        campaign_id: id,
        previous_status: previous,
        status: campaign.status,
        total_messages: messages.length,
        counts,
        already_sent: sentTo,
      },
      null,
      2,
    ),
  );
}

void main();
