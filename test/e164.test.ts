import { describe, expect, it } from "vitest";
import { toE164Ng } from "@/lib/phones/e164";

describe("toE164Ng", () => {
  it("normalises a Nigerian national number", () => {
    expect(toE164Ng("08072293289")).toBe("+2348072293289");
  });

  it("keeps an international number", () => {
    expect(toE164Ng("+234 807 229 3289")).toBe("+2348072293289");
  });

  it("rejects a short junk string", () => {
    expect(toE164Ng("1234")).toBeNull();
  });
});
