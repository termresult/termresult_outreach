import { isSuppressed } from "@/lib/campaigns/audience";
import { cleanEmail } from "@/lib/email/clean";
import { addSuppression, listSuppressions } from "@/lib/store/outreach";
import { getContact } from "@/lib/store/contacts";
import type { OutreachContact } from "@/types/contact";
import type { Message, Suppression } from "@/types/message";

export type EmailSendResult = {
  status: "sent" | "skipped" | "failed";
  skip_reason?: string;
  error?: string;
  provider_id?: string;
};

export type GmailPost = (url: string, init: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<Record<string, unknown>>;
  text: () => Promise<string>;
}>;

export function gmailConfig() {
  return {
    clientId: process.env.GOOGLE_GMAIL_CLIENT_ID?.trim() ?? "",
    clientSecret: process.env.GOOGLE_GMAIL_CLIENT_SECRET?.trim() ?? "",
    refreshToken: process.env.GOOGLE_GMAIL_REFRESH_TOKEN?.trim() ?? "",
    from: process.env.GMAIL_FROM?.trim() || "admin@termresult.com",
  };
}

export function isGmailConfigured(): boolean {
  const { clientId, clientSecret, refreshToken, from } = gmailConfig();
  return Boolean(clientId && clientSecret && refreshToken && from);
}

export function canSendEmail(
  contact: Pick<OutreachContact, "phone_e164" | "email">,
  suppressions: Suppression[] = [],
): boolean {
  if (!cleanEmail(contact.email)) return false;
  return !isSuppressed(contact as OutreachContact, "email", suppressions);
}

export function parseQueuedEmail(
  bodyRendered: string | null,
  fallbackSubject?: string | null,
): { subject: string; body: string } {
  const text = bodyRendered ?? "";
  const split = text.indexOf("\n\n");
  if (split === -1) {
    return {
      subject: fallbackSubject?.trim() || "TermResult",
      body: text,
    };
  }
  return {
    subject: text.slice(0, split).trim() || fallbackSubject?.trim() || "TermResult",
    body: text.slice(split + 2),
  };
}

function encodeSubject(subject: string): string {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

export function buildRfc822(input: { from: string; to: string; subject: string; body: string }): string {
  const lines = [
    `From: TermResult <${input.from}>`,
    `To: ${input.to}`,
    `Subject: ${encodeSubject(input.subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    input.body,
  ];
  return lines.join("\r\n");
}

export function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function isQuotaError(status: number, message: string): boolean {
  if (status === 429) return true;
  return /quota|rate.?limit|userRateLimitExceeded|dailyLimitExceeded/i.test(message);
}

function isHardInvalidAddress(status: number, message: string): boolean {
  if (status === 400 && /invalid/i.test(message)) return true;
  return /Invalid To header|recipient address|failedPrecondition/i.test(message);
}

async function accessToken(fetchImpl: GmailPost): Promise<{ token?: string; error?: string }> {
  const { clientId, clientSecret, refreshToken } = gmailConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = (await response.json().catch(async () => ({ error: await response.text() }))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    return { error: payload.error_description ?? payload.error ?? "Could not refresh Gmail token." };
  }
  return { token: payload.access_token };
}

export async function sendEmail(
  message: Message,
  options: {
    fetchImpl?: GmailPost;
    contact?: OutreachContact | null;
    subject?: string | null;
    suppressions?: Suppression[];
  } = {},
): Promise<EmailSendResult> {
  if (message.provider_id || message.status === "sent") {
    return { status: "sent", provider_id: message.provider_id ?? undefined };
  }

  const contact = options.contact ?? (await getContact(message.contact_id));
  const to = cleanEmail(message.to ?? contact?.email);
  if (!to) return { status: "skipped", skip_reason: "no_email" };
  if (contact && !canSendEmail(contact, options.suppressions ?? (await listSuppressions()))) {
    return { status: "skipped", skip_reason: "suppressed" };
  }

  const cfg = gmailConfig();
  if (!isGmailConfigured()) return { status: "skipped", skip_reason: "provider_not_configured" };

  const parsed = parseQueuedEmail(message.body_rendered, options.subject);
  const raw = toBase64Url(
    buildRfc822({
      from: cfg.from,
      to,
      subject: parsed.subject,
      body: parsed.body || "TermResult outreach",
    }),
  );

  const fetchImpl = options.fetchImpl ?? fetch;
  const token = await accessToken(fetchImpl);
  if (!token.token) return { status: "failed", error: token.error };

  const response = await fetchImpl("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  const payload = (await response.json().catch(async () => ({ error: { message: await response.text() } }))) as {
    id?: string;
    error?: { message?: string; status?: string };
  };
  const errorText = payload.error?.message ?? "Gmail rejected the send.";

  if (!response.ok) {
    if (isQuotaError(response.status, errorText)) {
      return { status: "failed", error: `quota.warn: ${errorText}` };
    }
    if (isHardInvalidAddress(response.status, errorText)) {
      await addSuppression({
        address: to,
        channel: "email",
        reason: "bounce",
        created_at: new Date().toISOString(),
      });
      return { status: "failed", error: errorText };
    }
    return { status: "failed", error: errorText };
  }

  return { status: "sent", provider_id: payload.id };
}
