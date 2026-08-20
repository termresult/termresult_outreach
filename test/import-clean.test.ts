import { describe, expect, it } from "vitest";
import { cleanEmail, cleanEmails } from "@/lib/email/clean";
import { emptyContact } from "@/types/contact";
import { mapCsvRow, mergeContact } from "@/lib/import/map-contact";

describe("email clean", () => {
  it("rejects placeholder addresses", () => {
    expect(cleanEmail("john@doe.com")).toBeNull();
    expect(cleanEmail("your.address@email.com")).toBeNull();
  });

  it("keeps a real school email and strips junk prefixes", () => {
    expect(cleanEmails(["%20info@gaatschool.com", "info@gaatschool.com"])).toEqual([
      "info@gaatschool.com",
    ]);
  });
});

describe("import upsert", () => {
  it("maps a CSV row", () => {
    const contact = mapCsvRow({
      name: "LEA Primary",
      phone: "08031234567",
      website: "",
      emails: "office@lea.ng; john@doe.com",
      owner: "",
      place_id: "emis:lea-abaji",
    });
    expect(contact?.phone_e164).toBe("+2348031234567");
    expect(contact?.email).toBe("office@lea.ng");
    expect(contact?.emails).toEqual(["office@lea.ng"]);
    expect(contact?.source).toBe("directory");
    expect(contact?.channels).toEqual({ whatsapp: true, sms: true, email: true });
  });

  it("updates a contact without touching a fake message row", () => {
    const messages = [{ id: "msg-1", contact_id: "emis:lea-abaji", body: "hello" }];
    const existing = emptyContact("emis:lea-abaji");
    existing.name = "Old name";
    existing.imported_at = "2026-01-01T00:00:00.000Z";
    const incoming = mapCsvRow({
      name: "New name",
      phone: "+2348031234567",
      website: "",
      emails: "",
      owner: "",
      place_id: "emis:lea-abaji",
    });
    const next = mergeContact(existing, incoming!, "2026-08-20T00:00:00.000Z");
    expect(next.name).toBe("New name");
    expect(next.imported_at).toBe("2026-01-01T00:00:00.000Z");
    expect(messages).toEqual([{ id: "msg-1", contact_id: "emis:lea-abaji", body: "hello" }]);
  });
});
