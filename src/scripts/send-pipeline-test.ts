import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { emptyContact } from "../types/contact";
import { upsertContacts } from "../lib/store/contacts";
import { confirmCampaign, createCampaign } from "../lib/campaigns/create";
import { saveSettings } from "../lib/store/settings";
import { emptyMessage } from "../types/message";
import { isGmailConfigured, sendEmail } from "../lib/send/email-gmail";
import { renderMerge } from "../lib/merge/render";

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

function testSchool(id: string, name: string, email: string) {
  const contact = emptyContact(id);
  contact.name = name;
  contact.area = "Pipeline Test";
  contact.email = email;
  contact.emails = [email];
  contact.channels = { whatsapp: false, sms: false, email: true };
  contact.source = "directory";
  return contact;
}

async function main() {
  loadEnvLocal();
  if (!isGmailConfigured()) throw new Error("Gmail is not configured.");

  const inboxes = [
    testSchool("test:rightpossible1", "Right Possible Test School", "rightpossible1@gmail.com"),
    testSchool("test:onoja", "Onoja Possible Test School", "onojapossible@gmail.com"),
  ];

  await upsertContacts(inboxes);
  await saveSettings({
    test_email: "rightpossible1@gmail.com",
    test_phone: "",
  });

  const subject = "TermResult test for {{school_name}}";
  const body =
    "Hello {{school_name}} in {{area}}.\n\nThis is a pipeline test from admin@termresult.com. If you got this, Gmail send is working.\n\n— TermResult Outreach";

  const campaign = await createCampaign({
    name: "Pipeline test — two inboxes",
    channel: "email",
    audience: { filter: { has_email: true, areas: ["Pipeline Test"] } },
    body,
    email_subject: subject,
    created_by: "officialtermresult@gmail.com",
  });
  const confirmed = await confirmCampaign(campaign.id);

  const results = [];
  for (const contact of inboxes) {
    const message = emptyMessage(`test:${campaign.id}:${contact.id}`, campaign.id, contact.id, "email");
    message.to = contact.email;
    message.body_rendered = `${renderMerge(subject, contact)}\n\n${renderMerge(body, contact)}`;
    const sent = await sendEmail(message, { contact, subject, suppressions: [] });
    results.push({ to: contact.email, status: sent.status, error: sent.error, provider_id: sent.provider_id });
  }

  console.log(
    JSON.stringify(
      {
        campaign_id: campaign.id,
        queued: confirmed.queued,
        gmail_from: process.env.GMAIL_FROM,
        results,
      },
      null,
      2,
    ),
  );
}

void main();
