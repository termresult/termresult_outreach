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
    throttle: { gap_seconds: 180, daily_cap: 400 },
    created_by: createdBy,
    created_at: new Date().toISOString(),
  };
}
