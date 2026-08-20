import type { CampaignAudience, CampaignChannel } from "@/types/campaign";
import type { OutreachContact } from "@/types/contact";
import type { Suppression } from "@/types/message";

export function canUseChannel(contact: OutreachContact, channel: CampaignChannel): boolean {
  if (channel === "email") return Boolean(contact.email);
  return Boolean(contact.phone_e164);
}

export function isSuppressed(
  contact: OutreachContact,
  channel: CampaignChannel,
  suppressions: Suppression[],
): boolean {
  const addresses = [contact.phone_e164, contact.email].filter(Boolean) as string[];
  return suppressions.some(
    (row) =>
      addresses.includes(row.address) && (row.channel === "all" || row.channel === channel),
  );
}

export function matchAudience(
  contacts: OutreachContact[],
  channel: CampaignChannel,
  audience: CampaignAudience,
  suppressions: Suppression[] = [],
): OutreachContact[] {
  const filter = audience.filter ?? {};
  return contacts.filter((contact) => {
    if (!canUseChannel(contact, channel)) return false;
    if (isSuppressed(contact, channel, suppressions)) return false;
    if (filter.has_phone && !contact.phone_e164) return false;
    if (filter.has_email && !contact.email) return false;
    if (filter.source && contact.source !== filter.source) return false;
    if (filter.areas?.length && !filter.areas.includes(contact.area ?? "")) return false;
    return true;
  });
}

export function destination(contact: OutreachContact, channel: CampaignChannel): string | null {
  return channel === "email" ? contact.email : contact.phone_e164;
}
