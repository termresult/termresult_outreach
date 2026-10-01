import { destination, matchAudience } from "@/lib/campaigns/audience";
import { buildQueue } from "@/lib/campaigns/queue";
import { renderMerge } from "@/lib/merge/render";
import { listContacts } from "@/lib/store/contacts";
import {
  getCampaign,
  listMessages,
  listSuppressions,
  saveCampaign,
  upsertMessages,
} from "@/lib/store/outreach";
import { emptySendCursor, emptyCampaign, type Campaign, type CampaignAudience, type CampaignChannel } from "@/types/campaign";
import { emailThrottleFromEnv } from "@/lib/send/throttle";

export type CampaignDraftInput = {
  name: string;
  channel: CampaignChannel;
  audience: CampaignAudience;
  body: string;
  email_subject?: string | null;
  gap_seconds?: number;
  daily_cap?: number;
  created_by: string;
};

export async function previewCampaign(input: {
  channel: CampaignChannel;
  audience: CampaignAudience;
  body: string;
}): Promise<{ count: number; previews: Array<{ id: string; name: string; to: string | null; body: string }> }> {
  const matches = matchAudience(await listContacts(), input.channel, input.audience, await listSuppressions());
  return {
    count: matches.length,
    previews: matches.slice(0, 3).map((contact) => ({
      id: contact.id,
      name: contact.name ?? "Unnamed school",
      to: destination(contact, input.channel),
      body: renderMerge(input.body, contact),
    })),
  };
}

export async function createCampaign(input: CampaignDraftInput): Promise<Campaign> {
  const id = `camp_${Date.now().toString(36)}`;
  const campaign = emptyCampaign(id, input.created_by);
  campaign.name = input.name.trim();
  campaign.channel = input.channel;
  campaign.audience = input.audience;
  campaign.template = {
    body: input.body,
    variables: ["school_name", "area", "owner_name", "website"],
  };
  campaign.email_subject = input.channel === "email" ? input.email_subject?.trim() || null : null;
  const envThrottle = emailThrottleFromEnv();
  campaign.throttle = {
    gap_seconds: input.gap_seconds ?? envThrottle.gap_seconds,
    daily_cap: input.daily_cap ?? envThrottle.daily_cap,
  };
  const matches = matchAudience(await listContacts(), campaign.channel, campaign.audience, await listSuppressions());
  campaign.audience_count = matches.length;
  console.info("campaign.created", { id: campaign.id, channel: campaign.channel, audience: campaign.audience_count });
  return saveCampaign(campaign);
}

export async function confirmCampaign(id: string): Promise<{ campaign: Campaign; queued: number }> {
  const campaign = await getCampaign(id);
  if (!campaign) throw new Error("Campaign not found.");
  const contacts = await listContacts();
  const suppressions = await listSuppressions();
  const existingKeys = new Set((await listMessages(id)).map((row) => row.idempotency_key));
  const rows = buildQueue({ campaign, contacts, suppressions, existingKeys });
  const result = await upsertMessages(rows);
  campaign.status = "confirmed";
  campaign.audience_count = matchAudience(contacts, campaign.channel, campaign.audience, suppressions).length;
  campaign.send_cursor = {
    ...(campaign.send_cursor ?? emptySendCursor()),
    queued_left: (campaign.send_cursor?.queued_left ?? 0) + result.created,
  };
  await saveCampaign(campaign);
  console.info("campaign.confirmed", { id, queued: result.created });
  return { campaign, queued: result.created };
}
