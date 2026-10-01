import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getCampaign, saveCampaign } from "../lib/store/outreach";

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

  campaign.status = "running";
  await saveCampaign(campaign);

  const tickUrl =
    process.env.EMAIL_TICK_URL?.trim() ||
    "https://termresult-email-tick-219195820109.us-central1.run.app/tick";
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) throw new Error("CRON_SECRET is missing.");

  const response = await fetch(tickUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ campaign_id: id }),
  });
  const body = await response.text();
  let tick: unknown = body;
  try {
    tick = JSON.parse(body);
  } catch {
    // keep raw text
  }

  console.log(
    JSON.stringify(
      {
        campaign_id: id,
        status: campaign.status,
        send_cursor: campaign.send_cursor,
        tick_http: response.status,
        tick,
      },
      null,
      2,
    ),
  );
  if (!response.ok) process.exit(1);
}

void main();
