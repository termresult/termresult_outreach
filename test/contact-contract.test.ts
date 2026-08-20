import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { emptyContact, type OutreachContact } from "@/types/contact";

const example = JSON.parse(
  readFileSync(resolve(__dirname, "../docs/contracts/contact.example.json"), "utf8"),
) as OutreachContact;

describe("OutreachContact contract", () => {
  it("example JSON has every required key", () => {
    const keys = Object.keys(emptyContact("x")).sort();
    expect(Object.keys(example).sort()).toEqual(keys);
    expect(example.channels).toEqual({ whatsapp: true, sms: true, email: true });
    expect(example.source).toBe("maps");
  });

  it("emptyContact fills the full tree", () => {
    const contact = emptyContact("emis:lea-abaji");
    expect(contact.schema_version).toBe("1.0.0");
    expect(contact.source).toBe("directory");
    expect(contact.emails).toEqual([]);
    expect(contact.channels.whatsapp).toBe(false);
    expect(contact.phone_e164).toBeNull();
  });
});
