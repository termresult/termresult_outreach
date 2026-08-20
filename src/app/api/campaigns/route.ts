import { NextResponse } from "next/server";
import { confirmCampaign, createCampaign } from "@/lib/campaigns/create";
import { MOCK_OPERATOR } from "@/lib/auth/mock";
import type { CampaignAudience, CampaignChannel } from "@/types/campaign";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    channel?: CampaignChannel;
    audience?: CampaignAudience;
    body?: string;
    email_subject?: string | null;
    gap_seconds?: number;
    daily_cap?: number;
    confirm?: boolean;
  };

  if (!body.name?.trim() || !body.channel || !body.body?.trim()) {
    return NextResponse.json({ error: "Name, channel, and message are required." }, { status: 400 });
  }

  const campaign = createCampaign({
    name: body.name,
    channel: body.channel,
    audience: body.audience ?? { filter: {} },
    body: body.body,
    email_subject: body.email_subject,
    gap_seconds: body.gap_seconds,
    daily_cap: body.daily_cap,
    created_by: MOCK_OPERATOR.email,
  });

  if (!body.confirm) {
    return NextResponse.json({ campaign, queued: 0 });
  }

  const confirmed = confirmCampaign(campaign.id);
  return NextResponse.json(confirmed);
}
