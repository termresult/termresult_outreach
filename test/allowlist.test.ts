import { describe, expect, it } from "vitest";
import { isAllowlisted } from "@/lib/auth/allowlist";

describe("allow-list", () => {
  it("lets the official TermResult mailbox in by default", () => {
    expect(isAllowlisted("officialtermresult@gmail.com", "")).toBe(true);
  });

  it("rejects an unknown Google account", () => {
    expect(isAllowlisted("stranger@gmail.com", "officialtermresult@gmail.com")).toBe(false);
  });

  it("accepts extra env emails", () => {
    expect(isAllowlisted("teammate@termresult.com", "teammate@termresult.com")).toBe(true);
  });
});
