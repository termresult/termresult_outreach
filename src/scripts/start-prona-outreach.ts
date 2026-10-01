import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { emptyContact } from "../types/contact";
import { upsertContacts } from "../lib/store/contacts";
import { confirmCampaign, createCampaign } from "../lib/campaigns/create";
import { saveCampaign } from "../lib/store/outreach";
import { emptyMessage } from "../types/message";
import { isGmailConfigured, sendEmail } from "../lib/send/email-gmail";
import { renderMerge } from "../lib/merge/render";
import { PRONA_BODY, PRONA_SUBJECT } from "../lib/campaigns/prona-template";

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

const CEO_EMAIL = "iyanuoluwadada15@gmail.com";
const CEO_NAME = "Iyanu";

const SUBJECT = PRONA_SUBJECT;
const BODY = PRONA_BODY;

const EXCLUDE_EMAILS = [
  CEO_EMAIL,
  "rightpossible1@gmail.com",
  "onojapossible@gmail.com",
  "possibleonoja@gmail.com",
];

async function main() {
  loadEnvLocal();
  if (!isGmailConfigured()) throw new Error("Gmail is not configured.");

  const ceo = emptyContact("staff:iyanuoluwadada15");
  ceo.name = CEO_NAME;
  ceo.area = "TermResult Staff";
  ceo.email = CEO_EMAIL;
  ceo.emails = [CEO_EMAIL];
  ceo.owner_name = CEO_NAME;
  ceo.channels = { whatsapp: false, sms: false, email: true };
  ceo.source = "directory";
  const upserted = await upsertContacts([ceo]);

  const ceoMessage = emptyMessage("test:prona:ceo", "camp_manual_ceo", ceo.id, "email");
  ceoMessage.to = CEO_EMAIL;
  ceoMessage.body_rendered = `${renderMerge(SUBJECT, ceo)}\n\n${renderMerge(BODY, ceo)}`;
  const ceoSend = await sendEmail(ceoMessage, { contact: ceo, subject: SUBJECT, suppressions: [] });
  if (ceoSend.status !== "sent") {
    throw new Error(`CEO send failed: ${ceoSend.error ?? ceoSend.skip_reason ?? "unknown"}`);
  }

  const campaign = await createCampaign({
    name: "PRONA / NAPPS — 29 August 2026",
    channel: "email",
    audience: {
      filter: {
        has_email: true,
        exclude_areas: ["Pipeline Test", "TermResult Staff"],
        exclude_emails: EXCLUDE_EMAILS,
      },
    },
    body: BODY,
    email_subject: SUBJECT,
    gap_seconds: 60,
    daily_cap: 400,
    created_by: "officialtermresult@gmail.com",
  });
  const confirmed = await confirmCampaign(campaign.id);
  confirmed.campaign.status = "running";
  await saveCampaign(confirmed.campaign);

  console.log(
    JSON.stringify(
      {
        ceo: {
          email: CEO_EMAIL,
          contact_created: upserted.created,
          contact_updated: upserted.updated,
          send_status: ceoSend.status,
          provider_id: ceoSend.provider_id,
        },
        campaign: {
          id: confirmed.campaign.id,
          status: confirmed.campaign.status,
          queued: confirmed.queued,
          audience_count: confirmed.campaign.audience_count,
          gap_seconds: confirmed.campaign.throttle.gap_seconds,
          daily_cap: confirmed.campaign.throttle.daily_cap,
        },
      },
      null,
      2,
    ),
  );
}

void main();
