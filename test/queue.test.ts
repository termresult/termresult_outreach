import { describe, expect, it } from "vitest";
import { buildQueue } from "@/lib/campaigns/queue";
import { emptyCampaign } from "@/types/campaign";
import { emptyContact } from "@/types/contact";

function school(id: string, phone: string | null, email: string | null) {
  const contact = emptyContact(id);
  contact.name = id;
  contact.phone_e164 = phone;
  contact.email = email;
  contact.channels = { whatsapp: Boolean(phone), sms: Boolean(phone), email: Boolean(email) };
  return contact;
}

describe("buildQueue", () => {
  it("queues only contacts that can use the channel", () => {
    const campaign = emptyCampaign("camp_1", "officialtermresult@gmail.com");
    campaign.channel = "whatsapp";
    campaign.template.body = "Hi {{school_name}}";
    campaign.audience = { filter: { has_phone: true, areas: [] } };
    const contacts = [
      school("a", "+2348011111111", null),
      school("b", "+2348022222222", "b@school.ng"),
      school("c", null, "c@school.ng"),
    ];
    const rows = buildQueue({ campaign, contacts });
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.contact_id).sort()).toEqual(["a", "b"]);
    expect(rows.every((row) => row.status === "queued")).toBe(true);
  });

  it("excludes staff and test inboxes from an email audience", () => {
    const campaign = emptyCampaign("camp_prona", "officialtermresult@gmail.com");
    campaign.channel = "email";
    campaign.email_subject = "Training";
    campaign.template.body = "Good day, {{school_name}}.";
    campaign.audience = {
      filter: {
        has_email: true,
        exclude_areas: ["Pipeline Test", "TermResult Staff"],
        exclude_emails: ["iyanuoluwadada15@gmail.com"],
      },
    };
    const staff = school("ceo", null, "iyanuoluwadada15@gmail.com");
    staff.area = "TermResult Staff";
    staff.name = "Iyanu";
    const test = school("test:one", null, "rightpossible1@gmail.com");
    test.area = "Pipeline Test";
    const real = school("school:1", null, "school@example.ng");
    real.area = "Gwarinpa";
    real.name = "Hope Academy";
    const rows = buildQueue({ campaign, contacts: [staff, test, real] });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.to).toBe("school@example.ng");
  });

  it("does not double-queue on a second confirm", () => {
    const campaign = emptyCampaign("camp_1", "officialtermresult@gmail.com");
    campaign.channel = "whatsapp";
    campaign.template.body = "Hi {{school_name}}";
    const contacts = [school("a", "+2348011111111", null)];
    const first = buildQueue({ campaign, contacts });
    const second = buildQueue({
      campaign,
      contacts,
      existingKeys: new Set(first.map((row) => row.idempotency_key)),
    });
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
  });
});
