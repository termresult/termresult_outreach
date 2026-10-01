export type CampaignChannel = "whatsapp" | "sms" | "email";

export type CampaignStatus =
  | "draft"
  | "confirmed"
  | "running"
  | "paused"
  | "done"
  | "cancelled";

export type CampaignAudience = {
  list_id?: string;
  filter?: {
    has_phone?: boolean;
    has_email?: boolean;
    areas?: string[];
    exclude_areas?: string[];
    exclude_emails?: string[];
    source?: "maps" | "directory";
  };
};

export type CampaignTemplate = {
  provider_template_id?: string;
  body?: string;
  variables?: string[];
};

export type CampaignThrottle = {
  gap_seconds: number;
  daily_cap: number;
};

export type CampaignSendCursor = {
  last_email_at: string | null;
  send_day: string | null;
  sent_today: number;
  queued_left: number;
};

export function emptySendCursor(queuedLeft = 0): CampaignSendCursor {
  return {
    last_email_at: null,
    send_day: null,
    sent_today: 0,
    queued_left: queuedLeft,
  };
}

export type Campaign = {
  schema_version: "1.0.0";
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  audience: CampaignAudience;
  audience_count: number;
  template: CampaignTemplate;
  email_subject: string | null;
  throttle: CampaignThrottle;
  send_cursor: CampaignSendCursor;
  created_by: string;
  created_at: string;
};

export function emptyCampaign(id: string, createdBy: string): Campaign {
  return {
    schema_version: "1.0.0",
    id,
    name: "",
    channel: "whatsapp",
    status: "draft",
    audience: { filter: { has_phone: true, areas: [] } },
    audience_count: 0,
    template: { variables: ["school_name"] },
    email_subject: null,
    throttle: { gap_seconds: 60, daily_cap: 400 },
    send_cursor: emptySendCursor(),
    created_by: createdBy,
    created_at: new Date().toISOString(),
  };
}
