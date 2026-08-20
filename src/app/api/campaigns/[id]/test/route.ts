import { NextResponse } from "next/server";
import { getCampaign, listMessages } from "@/lib/store/outreach";
import { getContact } from "@/lib/store/contacts";
import { getSettings } from "@/lib/store/settings";
import { emptyMessage } from "@/types/message";
import { isWhatsAppConfigured, sendWhatsApp } from "@/lib/send/whatsapp-twilio";
import { toE164Ng } from "@/lib/phones/e164";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = getCampaign(id);
  if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  if (campaign.channel !== "whatsapp") {
    return NextResponse.json({ error: "Test send is WhatsApp-only in this phase." }, { status: 400 });
  }
  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: "Twilio WhatsApp is not configured yet." },
      { status: 400 },
    );
  }

  const testPhone = toE164Ng(getSettings().test_phone);
  if (!testPhone) {
    return NextResponse.json(
      { error: "Set a test phone on Settings first (Nigerian number)." },
      { status: 400 },
    );
  }

  const sample = listMessages(id)[0];
  const contact = sample ? getContact(sample.contact_id) : null;
  const message = emptyMessage(`test:${id}:${Date.now()}`, id, contact?.id ?? "test", "whatsapp");
  message.to = testPhone;
  message.body_rendered = sample?.body_rendered ?? campaign.template.body ?? "TermResult test";

  const result = await sendWhatsApp(message, { contact });
  if (result.status !== "sent") {
    return NextResponse.json(
      { error: result.error ?? result.skip_reason ?? "Test send failed." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, to: testPhone, provider_id: result.provider_id });
}
