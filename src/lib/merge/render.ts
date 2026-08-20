import type { OutreachContact } from "@/types/contact";

const FIELDS = {
  school_name: (contact: OutreachContact) => contact.name?.trim() || "",
  area: (contact: OutreachContact) => contact.area?.trim() || "",
  owner_name: (contact: OutreachContact) => contact.owner_name?.trim() || "",
  website: (contact: OutreachContact) => contact.website?.trim() || "",
} as const;

export function renderMerge(template: string, contact: OutreachContact): string {
  let out = template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const read = FIELDS[key as keyof typeof FIELDS];
    if (!read) return "";
    const value = read(contact);
    return value === "null" ? "" : value;
  });
  out = out.replace(/[ \t]{2,}/g, " ").replace(/ +\n/g, "\n").replace(/\s+,/g, ",");
  return out.trim();
}
