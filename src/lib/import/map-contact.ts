import { emptyContact, type OutreachContact } from "@/types/contact";
import { cleanEmails } from "@/lib/email/clean";
import { toE164Ng } from "@/lib/phones/e164";

export type DiscoveryRecord = {
  place_id?: string;
  identity?: { name?: string | null };
  location?: {
    area_query?: string | null;
    formatted_address?: string | null;
    address_components?: { locality?: string | null };
  };
  contact?: {
    from_maps?: {
      international_phone?: string | null;
      national_phone?: string | null;
      website?: string | null;
    };
    from_website?: {
      emails?: Array<{ value?: string | null }>;
      extra_phones?: Array<{ value?: string | null }>;
    };
  };
  owner?: { name?: string | null };
};

export function applyChannels(contact: OutreachContact): OutreachContact {
  const hasPhone = Boolean(contact.phone_e164);
  const hasEmail = Boolean(contact.email);
  contact.channels = {
    whatsapp: hasPhone,
    sms: hasPhone,
    email: hasEmail,
  };
  return contact;
}

export function mapCsvRow(row: Record<string, string>): OutreachContact | null {
  const placeId = (row.place_id || row.source_place_id || "").trim();
  if (!placeId) return null;

  const emails = cleanEmails((row.emails || "").split(/[;|,]/));
  const phoneRaw = row.phone?.trim() || null;
  const contact = emptyContact(placeId);
  contact.name = row.name?.trim() || null;
  contact.phone_raw = phoneRaw;
  contact.phone_e164 = toE164Ng(phoneRaw);
  contact.emails = emails;
  contact.email = emails[0] ?? null;
  contact.website = row.website?.trim() || null;
  contact.owner_name = row.owner?.trim() || null;
  return applyChannels(contact);
}

export function mapDiscoveryRecord(record: DiscoveryRecord): OutreachContact | null {
  const placeId = record.place_id?.trim();
  if (!placeId) return null;

  const maps = record.contact?.from_maps;
  const website = record.contact?.from_website;
  const extraPhones = website?.extra_phones?.map((p) => p.value) ?? [];
  const phoneRaw =
    maps?.international_phone?.trim() ||
    maps?.national_phone?.trim() ||
    extraPhones.find(Boolean) ||
    null;
  const emails = cleanEmails(website?.emails?.map((e) => e.value) ?? []);
  const locality = record.location?.address_components?.locality?.trim() || null;

  const contact = emptyContact(placeId);
  contact.name = record.identity?.name?.trim() || null;
  contact.area = record.location?.area_query?.trim() || locality;
  contact.address = record.location?.formatted_address?.trim() || null;
  contact.phone_raw = phoneRaw;
  contact.phone_e164 = toE164Ng(phoneRaw);
  contact.emails = emails;
  contact.email = emails[0] ?? null;
  contact.website = maps?.website?.trim() || null;
  contact.owner_name = record.owner?.name?.trim() || null;
  return applyChannels(contact);
}

export function mergeContact(
  existing: OutreachContact | undefined,
  incoming: OutreachContact,
  now: string,
): OutreachContact {
  if (!existing) {
    return { ...incoming, imported_at: now, updated_at: now };
  }
  return applyChannels({
    ...existing,
    name: incoming.name ?? existing.name,
    area: incoming.area ?? existing.area,
    address: incoming.address ?? existing.address,
    phone_raw: incoming.phone_raw ?? existing.phone_raw,
    phone_e164: incoming.phone_e164 ?? existing.phone_e164,
    email: incoming.email ?? existing.email,
    emails: incoming.emails.length ? incoming.emails : existing.emails,
    website: incoming.website ?? existing.website,
    owner_name: incoming.owner_name ?? existing.owner_name,
    source: incoming.source,
    updated_at: now,
    imported_at: existing.imported_at ?? now,
  });
}
