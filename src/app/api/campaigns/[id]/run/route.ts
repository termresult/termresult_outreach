import { NextResponse } from "next/server";
import { getCampaign, saveCampaign } from "@/lib/store/outreach";
import { processQueue } from "@/lib/send/process";
import { tickEmailCampaign } from "@/lib/send/email-tick";
import { isGmailConfigured } from "@/lib/send/email-gmail";
import { isWhatsAppConfigured } from "@/lib/send/whatsapp-twilio";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as {
    realList?: boolean;
    pause?: boolean;
    resume?: boolean;
    tick?: boolean;
  };

  if (campaign.channel === "email") {
    if (!isGmailConfigured()) {
      return NextResponse.json(
        {
          error:
            "Gmail is not configured. Add GOOGLE_GMAIL_CLIENT_ID, GOOGLE_GMAIL_CLIENT_SECRET, GOOGLE_GMAIL_REFRESH_TOKEN, and GMAIL_FROM.",
        },
        { status: 400 },
      );
    }
    if (body.pause) {
      campaign.status = "paused";
      await saveCampaign(campaign);
      return NextResponse.json({ campaign_id: id, status: campaign.status });
    }
    if (body.tick) {
      if (campaign.status !== "running") {
        return NextResponse.json({ error: "Start the campaign before ticking." }, { status: 400 });
      }
      return NextResponse.json(await tickEmailCampaign(id));
    }
    if (body.resume) {
      campaign.status = "running";
      await saveCampaign(campaign);
      return NextResponse.json({ campaign_id: id, status: campaign.status });
    }
    if (!body.realList) {
      return NextResponse.json({ error: "Confirm that this is the real list." }, { status: 400 });
    }
    campaign.status = "running";
    await saveCampaign(campaign);
    return NextResponse.json({ campaign_id: id, status: campaign.status });
  }

  if (campaign.channel !== "whatsapp") {
    return NextResponse.json({ error: "Only WhatsApp and email can run in this phase." }, { status: 400 });
  }
  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      {
        error:
          "Twilio WhatsApp is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM to .env.local.",
      },
      { status: 400 },
    );
  }
  if (!body.realList) {
    return NextResponse.json({ error: "Confirm that this is the real list." }, { status: 400 });
  }

  const result = await processQueue(id);
  return NextResponse.json({ campaign_id: id, ...result });
}
