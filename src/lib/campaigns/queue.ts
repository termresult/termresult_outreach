import { destination, matchAudience } from "@/lib/campaigns/audience";
import { renderMerge } from "@/lib/merge/render";
import type { Campaign } from "@/types/campaign";
import type { OutreachContact } from "@/types/contact";
import type { Message, Suppression } from "@/types/message";
import { emptyMessage } from "@/types/message";

export function buildQueue(input: {
  campaign: Campaign;
  contacts: OutreachContact[];
  suppressions?: Suppression[];
  existingKeys?: Set<string>;
}): Message[] {
  const existing = input.existingKeys ?? new Set<string>();
  const matches = matchAudience(
    input.contacts,
    input.campaign.channel,
    input.campaign.audience,
    input.suppressions ?? [],
  );
  const body = input.campaign.template.body ?? "";
  const rows: Message[] = [];

  for (const contact of matches) {
    const key = `${input.campaign.id}:${contact.id}:${input.campaign.channel}`;
    if (existing.has(key)) continue;
    const message = emptyMessage(key, input.campaign.id, contact.id, input.campaign.channel);
    message.to = destination(contact, input.campaign.channel);
    message.body_rendered = renderMerge(body, contact);
    if (input.campaign.channel === "email" && input.campaign.email_subject) {
      message.body_rendered = `${renderMerge(input.campaign.email_subject, contact)}\n\n${message.body_rendered}`;
    }
    rows.push(message);
  }
  return rows;
}
