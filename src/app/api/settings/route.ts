import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/store/settings";
import { isGmailConfigured } from "@/lib/send/email-gmail";
import { isWhatsAppConfigured } from "@/lib/send/whatsapp-twilio";

export async function GET() {
  return NextResponse.json({
    ...(await getSettings()),
    whatsapp_ready: isWhatsAppConfigured(),
    gmail_ready: isGmailConfigured(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { test_phone?: string; test_email?: string };
  return NextResponse.json({
    ...(await saveSettings({
      test_phone: body.test_phone?.trim() ?? "",
      test_email: body.test_email?.trim() ?? "",
    })),
    whatsapp_ready: isWhatsAppConfigured(),
    gmail_ready: isGmailConfigured(),
  });
}
