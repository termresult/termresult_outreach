import type { CampaignChannel } from "./campaign";

export type MessageStatus = "queued" | "sending" | "sent" | "failed" | "skipped";

export type Message = {
  schema_version: "1.0.0";
  id: string;
  campaign_id: string;
  contact_id: string;
  channel: CampaignChannel;
  to: string | null;
  body_rendered: string | null;
  status: MessageStatus;
  skip_reason: string | null;
  error: string | null;
  provider_id: string | null;
  idempotency_key: string;
  attempted_at: string | null;
  completed_at: string | null;
};

export type SuppressionChannel = CampaignChannel | "all";
export type SuppressionReason = "stop" | "bounce" | "manual";

export type Suppression = {
  address: string;
  channel: SuppressionChannel;
  reason: SuppressionReason;
  created_at: string;
};

export function emptyMessage(
  id: string,
  campaignId: string,
  contactId: string,
  channel: CampaignChannel,
): Message {
  return {
    schema_version: "1.0.0",
    id,
    campaign_id: campaignId,
    contact_id: contactId,
    channel,
    to: null,
    body_rendered: null,
    status: "queued",
    skip_reason: null,
    error: null,
    provider_id: null,
    idempotency_key: `${campaignId}:${contactId}:${channel}`,
    attempted_at: null,
    completed_at: null,
  };
}
