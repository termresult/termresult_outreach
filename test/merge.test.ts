import { describe, expect, it } from "vitest";
import { renderMerge } from "@/lib/merge/render";
import { emptyContact } from "@/types/contact";

describe("renderMerge", () => {
  it("does not print the word null when owner is missing", () => {
    const contact = emptyContact("emis:lea");
    contact.name = "LEA Primary";
    contact.area = "Abaji";
    contact.owner_name = null;
    const text = renderMerge("Hello {{owner_name}} at {{school_name}} in {{area}}.", contact);
    expect(text).toBe("Hello at LEA Primary in Abaji.");
    expect(text).not.toContain("null");
  });
});
