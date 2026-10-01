import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyContact } from "@/types/contact";
import { emptyCampaign } from "@/types/campaign";
import { emptyMessage } from "@/types/message";
import { buildQueue } from "@/lib/campaigns/queue";
import { renderMerge } from "@/lib/merge/render";
import { canSendEmail, parseQueuedEmail, sendEmail } from "@/lib/send/email-gmail";

describe("email adapter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses a junk or missing email", () => {
    const junk = emptyContact("emis:junk");
    junk.email = "john@doe.com";
    expect(canSendEmail(junk, [])).toBe(false);
    const missing = emptyContact("emis:none");
    expect(canSendEmail(missing, [])).toBe(false);
  });

  it("puts the school name in the subject", () => {
    const contact = emptyContact("emis:lea");
    contact.name = "LEA Primary Gwagwalada";
    contact.area = "Gwagwalada";
    contact.email = "office@leagwag.sch.ng";
    const subject = renderMerge("TermResult for {{school_name}}", contact);
    expect(subject).toBe("TermResult for LEA Primary Gwagwalada");

    const campaign = emptyCampaign("camp_mail", "officialtermresult@gmail.com");
    campaign.channel = "email";
    campaign.email_subject = "Hello {{school_name}}";
    campaign.template.body = "We can help {{school_name}} in {{area}}.";
    campaign.audience = { filter: { has_email: true, areas: [] } };
    const [row] = buildQueue({ campaign, contacts: [contact] });
    const parsed = parseQueuedEmail(row.body_rendered, campaign.email_subject);
    expect(parsed.subject).toBe("Hello LEA Primary Gwagwalada");
    expect(parsed.body).toContain("LEA Primary Gwagwalada");
    expect(parsed.body).toContain("Gwagwalada");
  });

  it("does not call Gmail twice when the message already has a provider id", async () => {
    const fetchImpl = vi.fn();
    const message = emptyMessage("key", "camp", "contact", "email");
    message.to = "office@school.ng";
    message.provider_id = "msg_already";
    message.status = "sent";
    const result = await sendEmail(message, { fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.provider_id).toBe("msg_already");
  });

  it("sends one RFC822 message after refreshing the token", async () => {
    vi.stubEnv("GOOGLE_GMAIL_CLIENT_ID", "client");
    vi.stubEnv("GOOGLE_GMAIL_CLIENT_SECRET", "secret");
    vi.stubEnv("GOOGLE_GMAIL_REFRESH_TOKEN", "refresh");
    vi.stubEnv("GMAIL_FROM", "admin@termresult.com");

    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes("oauth2.googleapis.com/token")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: "ya29.test" }),
          text: async () => "",
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: "msg_123" }),
        text: async () => "",
      };
    });

    const contact = emptyContact("emis:send");
    contact.name = "Unity High";
    contact.email = "office@unity.sch.ng";
    const message = emptyMessage("key", "camp", contact.id, "email");
    message.to = contact.email;
    message.body_rendered = "Hello Unity High\n\nWe can help Unity High.";

    const result = await sendEmail(message, { fetchImpl, contact, suppressions: [] });
    expect(result).toEqual({ status: "sent", provider_id: "msg_123" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const sendCall = fetchImpl.mock.calls[1];
    expect(String(sendCall[0])).toContain("gmail.googleapis.com");
    expect(sendCall[1]?.method).toBe("POST");
  });
});
