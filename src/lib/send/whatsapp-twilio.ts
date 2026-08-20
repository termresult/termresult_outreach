import { isSuppressed } from "@/lib/campaigns/audience";
import { getContact } from "@/lib/store/contacts";
import { addSuppression } from "@/lib/store/outreach";
import type { OutreachContact } from "@/types/contact";
import type { Message, Suppression } from "@/types/message";

export type WhatsAppSendResult = {
  status: "sent" | "skipped" | "failed";
  skip_reason?: string;
  error?: string;
  provider_id?: string;
};

export type TwilioPost = (url: string, init: RequestInit) => Promise<{
  ok: boolean;
  json: () => Promise<Record<string, unknown>>;
  text: () => Promise<string>;
}>;

export function twilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() ?? "";
  const apiKeySid = process.env.TWILIO_API_KEY_SID?.trim() ?? "";
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET?.trim() ?? "";
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() ?? "";
  let from = process.env.TWILIO_WHATSAPP_FROM?.trim() ?? "";
  if (from && !from.startsWith("whatsapp:")) from = `whatsapp:${from}`;
  const authUser = apiKeySid || accountSid;
  const authPass = apiKeySecret || authToken;
  return {
    accountSid,
    apiKeySid,
    authUser,
    authPass,
    from,
    contentSid: process.env.TWILIO_WHATSAPP_CONTENT_SID?.trim() ?? "",
    statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL?.trim() ?? "",
    allowFreeform: process.env.TWILIO_WHATSAPP_SANDBOX === "1",
  };
}

export function isWhatsAppConfigured(): boolean {
  const { accountSid, authPass, from } = twilioConfig();
  return Boolean(accountSid && authPass && from);
}

export function canSendWhatsApp(
  contact: Pick<OutreachContact, "phone_e164" | "email">,
  suppressions: Suppression[] = [],
): boolean {
  if (!contact.phone_e164) return false;
  return !isSuppressed(contact as OutreachContact, "whatsapp", suppressions);
}

export function whatsappAddress(e164: string): string {
  const clean = e164.startsWith("whatsapp:") ? e164.slice(9) : e164;
  return `whatsapp:${clean.startsWith("+") ? clean : `+${clean}`}`;
}

export function e164FromWhatsApp(address: string): string {
  return address.replace(/^whatsapp:/, "").trim();
}

export function isStopText(body: string | null | undefined): boolean {
  return /^(stop|unsubscribe|cancel|end|quit)\b/i.test((body ?? "").trim());
}

export function contentVariables(contact: OutreachContact): Record<string, string> {
  return {
    "1": contact.name ?? "",
    "2": contact.area ?? "",
    "3": contact.owner_name ?? "",
    "4": contact.website ?? "",
  };
}

export async function sendWhatsApp(
  message: Message,
  options: { fetchImpl?: TwilioPost; contact?: OutreachContact | null } = {},
): Promise<WhatsAppSendResult> {
  if (message.provider_id || message.status === "sent") {
    return { status: "sent", provider_id: message.provider_id ?? undefined };
  }

  const contact = options.contact ?? getContact(message.contact_id);
  if (!message.to && !contact?.phone_e164) {
    return { status: "skipped", skip_reason: "no_phone" };
  }

  const cfg = twilioConfig();
  if (!cfg.accountSid || !cfg.authPass || !cfg.from) {
    return { status: "skipped", skip_reason: "provider_not_configured" };
  }
  if (!cfg.contentSid && !cfg.allowFreeform) {
    return {
      status: "failed",
      error: "Set TWILIO_WHATSAPP_CONTENT_SID. WhatsApp only sends the approved template.",
    };
  }

  const to = whatsappAddress(message.to ?? contact?.phone_e164 ?? "");
  const params = new URLSearchParams({ From: cfg.from, To: to });
  if (cfg.contentSid && contact) {
    params.set("ContentSid", cfg.contentSid);
    params.set("ContentVariables", JSON.stringify(contentVariables(contact)));
  } else if (cfg.allowFreeform) {
    params.set("Body", message.body_rendered ?? "TermResult outreach");
  }
  if (cfg.statusCallback) params.set("StatusCallback", cfg.statusCallback);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`;
  const auth = Buffer.from(`${cfg.authUser}:${cfg.authPass}`).toString("base64");
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const payload = (await response.json().catch(async () => ({ message: await response.text() }))) as {
    sid?: string;
    message?: string;
    error_message?: string;
  };

  if (!response.ok) {
    return {
      status: "failed",
      error: payload.error_message ?? payload.message ?? "Twilio rejected the send.",
    };
  }

  return { status: "sent", provider_id: payload.sid };
}

export function applyInboundStop(from: string, body: string): boolean {
  if (!from || !isStopText(body)) return false;
  addSuppression({
    address: e164FromWhatsApp(from),
    channel: "whatsapp",
    reason: "stop",
    created_at: new Date().toISOString(),
  });
  return true;
}

export function mapTwilioStatus(status: string): "sent" | "failed" | "queued" | "sending" {
  const value = status.toLowerCase();
  if (value === "delivered" || value === "sent" || value === "read") return "sent";
  if (value === "undelivered" || value === "failed") return "failed";
  if (value === "sending" || value === "accepted") return "sending";
  return "queued";
}
