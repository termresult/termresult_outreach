import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PRONA_BODY, PRONA_SUBJECT } from "../lib/campaigns/prona-template";
import { renderMerge } from "../lib/merge/render";
import { listContacts } from "../lib/store/contacts";
import { getCampaign, listMessages, replaceMessages, saveCampaign } from "../lib/store/outreach";

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
  if (campaign.status === "running") {
    throw new Error("Campaign is running. Pause it before rewriting queued mail.");
  }

  campaign.email_subject = PRONA_SUBJECT;
  campaign.template = {
    ...campaign.template,
    body: PRONA_BODY,
    variables: ["school_name", "area", "owner_name", "website"],
  };
  await saveCampaign(campaign);

  const contacts = new Map((await listContacts()).map((row) => [row.id, row]));
  const queued = (await listMessages(id)).filter((row) => row.status === "queued");
  const updated = [];
  let missing = 0;
  for (const message of queued) {
    const contact = contacts.get(message.contact_id);
    if (!contact) {
      missing += 1;
      continue;
    }
    message.body_rendered = `${renderMerge(PRONA_SUBJECT, contact)}\n\n${renderMerge(PRONA_BODY, contact)}`;
    updated.push(message);
  }
  await replaceMessages(updated);

  const sample = updated[0]?.body_rendered ?? "";
  console.log(
    JSON.stringify(
      {
        campaign_id: id,
        status: campaign.status,
        subject: campaign.email_subject,
        queued_rewritten: updated.length,
        missing_contacts: missing,
        sample,
      },
      null,
      2,
    ),
  );
}

void main();
