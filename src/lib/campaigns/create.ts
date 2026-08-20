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
import { emptyCampaign, type Campaign, type CampaignAudience, type CampaignChannel } from "@/types/campaign";

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

export function previewCampaign(input: {
  channel: CampaignChannel;
  audience: CampaignAudience;
  body: string;
}): { count: number; previews: Array<{ id: string; name: string; to: string | null; body: string }> } {
  const matches = matchAudience(listContacts(), input.channel, input.audience, listSuppressions());
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

export function createCampaign(input: CampaignDraftInput): Campaign {
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
  campaign.throttle = {
    gap_seconds: input.gap_seconds ?? 180,
    daily_cap: input.daily_cap ?? 400,
  };
  const matches = matchAudience(listContacts(), campaign.channel, campaign.audience, listSuppressions());
  campaign.audience_count = matches.length;
  console.info("campaign.created", { id: campaign.id, channel: campaign.channel, audience: campaign.audience_count });
  return saveCampaign(campaign);
}

export function confirmCampaign(id: string): { campaign: Campaign; queued: number } {
  const campaign = getCampaign(id);
  if (!campaign) throw new Error("Campaign not found.");
  const contacts = listContacts();
  const suppressions = listSuppressions();
  const existingKeys = new Set(listMessages(id).map((row) => row.idempotency_key));
  const rows = buildQueue({ campaign, contacts, suppressions, existingKeys });
  const result = upsertMessages(rows);
  campaign.status = "confirmed";
  campaign.audience_count = matchAudience(contacts, campaign.channel, campaign.audience, suppressions).length;
  saveCampaign(campaign);
  console.info("campaign.confirmed", { id, queued: result.created });
  return { campaign, queued: result.created };
}
