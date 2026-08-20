export const SCHEMA_VERSION = "1.0.0" as const;

export type ContactSource = "maps" | "directory";

export type ContactChannels = {
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
};

export type OutreachContact = {
  schema_version: typeof SCHEMA_VERSION;
  id: string;
  source_place_id: string;
  name: string | null;
  area: string | null;
  address: string | null;
  phone_e164: string | null;
  phone_raw: string | null;
  email: string | null;
  emails: string[];
  website: string | null;
  owner_name: string | null;
  channels: ContactChannels;
  source: ContactSource;
  imported_at: string | null;
  updated_at: string | null;
};

export function emptyContact(sourcePlaceId: string): OutreachContact {
  return {
    schema_version: SCHEMA_VERSION,
    id: sourcePlaceId,
    source_place_id: sourcePlaceId,
    name: null,
    area: null,
    address: null,
    phone_e164: null,
    phone_raw: null,
    email: null,
    emails: [],
    website: null,
    owner_name: null,
    channels: { whatsapp: false, sms: false, email: false },
    source: sourcePlaceId.startsWith("ChIJ") ? "maps" : "directory",
    imported_at: null,
    updated_at: null,
  };
}
