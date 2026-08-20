import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "@/lib/import/parse-csv";
import {
  mapCsvRow,
  mapDiscoveryRecord,
  type DiscoveryRecord,
} from "@/lib/import/map-contact";
import { upsertContacts, type ImportSummary } from "@/lib/store/contacts";
import type { OutreachContact } from "@/types/contact";

export const FCT_RECORDS_PATH = resolve(
  process.cwd(),
  "../termresult_school_discovery/data/runs/abuja-fct-20260817T162901Z/records.json",
);

export const FCT_CSV_PATH = resolve(
  process.cwd(),
  "../termresult_school_discovery/data/runs/abuja-fct-20260817T162901Z/contacts-live.csv",
);

export function contactsFromCsv(text: string): OutreachContact[] {
  return parseCsv(text)
    .map(mapCsvRow)
    .filter((row): row is OutreachContact => row !== null);
}

export function contactsFromRecordsJson(text: string): OutreachContact[] {
  const parsed = JSON.parse(text) as DiscoveryRecord[] | { records?: DiscoveryRecord[] };
  const rows = Array.isArray(parsed) ? parsed : (parsed.records ?? []);
  return rows.map(mapDiscoveryRecord).filter((row): row is OutreachContact => row !== null);
}

export function importText(filename: string, text: string): ImportSummary {
  const lower = filename.toLowerCase();
  const contacts = lower.endsWith(".json") ? contactsFromRecordsJson(text) : contactsFromCsv(text);
  return upsertContacts(contacts);
}

export function importFctFromDisk(): ImportSummary {
  try {
    const text = readFileSync(FCT_RECORDS_PATH, "utf8");
    return importText("records.json", text);
  } catch {
    const text = readFileSync(FCT_CSV_PATH, "utf8");
    return importText("contacts-live.csv", text);
  }
}
