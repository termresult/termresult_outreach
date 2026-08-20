import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyContact } from "@/types/contact";
import { emptyMessage } from "@/types/message";
import {
  applyInboundStop,
  canSendWhatsApp,
  isStopText,
  sendWhatsApp,
} from "@/lib/send/whatsapp-twilio";
import { listSuppressions } from "@/lib/store/outreach";

describe("WhatsApp adapter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses a contact without a phone", () => {
    const contact = emptyContact("emis:nophone");
    contact.email = "school@example.ng";
    expect(canSendWhatsApp(contact)).toBe(false);
  });

  it("does not call Twilio twice when the message already has a provider id", async () => {
    const fetchImpl = vi.fn();
    const message = emptyMessage("key", "camp", "contact", "whatsapp");
    message.to = "+2348011111111";
    message.provider_id = "SM_ALREADY";
    message.status = "sent";
    const result = await sendWhatsApp(message, { fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.provider_id).toBe("SM_ALREADY");
  });

  it("creates a suppression from a STOP inbound", () => {
    expect(isStopText("STOP")).toBe(true);
    applyInboundStop("whatsapp:+2348099988877", "stop please");
    const found = listSuppressions().find((row) => row.address === "+2348099988877");
    expect(found?.channel).toBe("whatsapp");
    expect(found?.reason).toBe("stop");
  });
});
