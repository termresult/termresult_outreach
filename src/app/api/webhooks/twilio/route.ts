import { NextResponse } from "next/server";
import {
  applyInboundStop,
  e164FromWhatsApp,
  mapTwilioStatus,
} from "@/lib/send/whatsapp-twilio";
import { findMessageByProviderId, patchMessage } from "@/lib/store/outreach";

export async function POST(request: Request) {
  const form = await request.formData();
  const sid = String(form.get("MessageSid") ?? form.get("SmsSid") ?? "");
  const status = String(form.get("MessageStatus") ?? form.get("SmsStatus") ?? "");
  const body = String(form.get("Body") ?? "");
  const from = e164FromWhatsApp(String(form.get("From") ?? ""));

  if (sid && status) {
    const row = findMessageByProviderId(sid);
    if (row) {
      const mapped = mapTwilioStatus(status);
      patchMessage(row.idempotency_key, {
        status: mapped === "queued" ? row.status : mapped,
        error: mapped === "failed" ? `Twilio: ${status}` : row.error,
        completed_at: mapped === "sent" || mapped === "failed" ? new Date().toISOString() : row.completed_at,
      });
    }
  }

  if (from) applyInboundStop(from, body);

  return new NextResponse("<Response></Response>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
