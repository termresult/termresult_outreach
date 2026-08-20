import { NextResponse } from "next/server";
import { getCampaign } from "@/lib/store/outreach";
import { processQueue } from "@/lib/send/process";
import { isWhatsAppConfigured } from "@/lib/send/whatsapp-twilio";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = getCampaign(id);
  if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  if (campaign.channel !== "whatsapp") {
    return NextResponse.json({ error: "Only WhatsApp can run in this phase." }, { status: 400 });
  }
  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: "Twilio WhatsApp is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM to .env.local." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { realList?: boolean };
  if (!body.realList) {
    return NextResponse.json({ error: "Confirm that this is the real list." }, { status: 400 });
  }

  const result = await processQueue(id);
  return NextResponse.json({ campaign_id: id, ...result });
}
