import { NextResponse } from "next/server";
import { previewCampaign } from "@/lib/campaigns/create";
import type { CampaignAudience, CampaignChannel } from "@/types/campaign";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    channel?: CampaignChannel;
    audience?: CampaignAudience;
    body?: string;
  };
  if (!body.channel) {
    return NextResponse.json({ error: "Pick a channel." }, { status: 400 });
  }
  return NextResponse.json(
    previewCampaign({
      channel: body.channel,
      audience: body.audience ?? { filter: {} },
      body: body.body ?? "",
    }),
  );
}
