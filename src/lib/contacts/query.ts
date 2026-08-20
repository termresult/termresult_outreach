import type { ContactSource, OutreachContact } from "@/types/contact";

export type ContactQuery = {
  q?: string;
  phone?: "yes" | "no" | "";
  email?: "yes" | "no" | "";
  source?: ContactSource | "";
  area?: string;
  page?: number;
};

export const PAGE_SIZE = 40;

export function filterContacts(contacts: OutreachContact[], query: ContactQuery): OutreachContact[] {
  const needle = query.q?.trim().toLowerCase() ?? "";
  return contacts.filter((contact) => {
    if (needle && !`${contact.name ?? ""} ${contact.area ?? ""}`.toLowerCase().includes(needle)) {
      return false;
    }
    if (query.phone === "yes" && !contact.phone_e164) return false;
    if (query.phone === "no" && contact.phone_e164) return false;
    if (query.email === "yes" && !contact.email) return false;
    if (query.email === "no" && contact.email) return false;
    if (query.source && contact.source !== query.source) return false;
    if (query.area && (contact.area ?? "") !== query.area) return false;
    return true;
  });
}

export function parseContactQuery(search: URLSearchParams): ContactQuery {
  const phone = search.get("phone");
  const email = search.get("email");
  const source = search.get("source");
  const page = Number(search.get("page") || "1");
  return {
    q: search.get("q") ?? "",
    phone: phone === "yes" || phone === "no" ? phone : "",
    email: email === "yes" || email === "no" ? email : "",
    source: source === "maps" || source === "directory" ? source : "",
    area: search.get("area") ?? "",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}
