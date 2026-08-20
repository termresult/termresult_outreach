import type { CampaignChannel } from "@/types/campaign";
import type { Message } from "@/types/message";
import { isWhatsAppConfigured, sendWhatsApp } from "@/lib/send/whatsapp-twilio";

export type AdapterResult = {
  status: "sent" | "skipped" | "failed";
  skip_reason?: string;
  error?: string;
  provider_id?: string;
};

export type ChannelAdapter = {
  channel: CampaignChannel;
  configured: boolean;
  send: (message: Message) => Promise<AdapterResult>;
};

function stub(channel: CampaignChannel): ChannelAdapter {
  return {
    channel,
    configured: false,
    async send() {
      return { status: "skipped", skip_reason: "provider_not_configured" };
    },
  };
}

export function getAdapter(channel: CampaignChannel): ChannelAdapter {
  if (channel === "whatsapp") {
    return {
      channel,
      configured: isWhatsAppConfigured(),
      send: (message) => sendWhatsApp(message),
    };
  }
  return stub(channel);
}
