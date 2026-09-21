import type { Campaign } from "@/types/campaign";
import type { OutreachContact } from "@/types/contact";
import type { Message, Suppression } from "@/types/message";
import type { Proprietor } from "@/types/proprietor";
import type { OutreachSettings } from "@/lib/store/settings";
import type { InstallSlot } from "@/lib/proprietors/install-date";
import type { Attendee } from "@/types/attendee";
import type { Reminder } from "@/types/reminder";

export type MemoryStore = {
  contacts: Record<string, OutreachContact>;
  campaigns: Record<string, Campaign>;
  messages: Record<string, Message>;
  suppressions: Suppression[];
  settings: OutreachSettings | null;
  proprietors: Record<string, Proprietor>;
  install_slots: Record<string, InstallSlot>;
  attendees: Record<string, Attendee>;
  reminders: Record<string, Reminder>;
};

const memory: MemoryStore = {
  contacts: {},
  campaigns: {},
  messages: {},
  suppressions: [],
  settings: null,
  proprietors: {},
  install_slots: {},
  attendees: {},
  reminders: {},
};

export function useMemoryStore(): boolean {
  return process.env.VITEST === "true" || process.env.OUTREACH_STORE === "memory";
}

export function memoryStore(): MemoryStore {
  return memory;
}

export function resetMemoryStore() {
  memory.contacts = {};
  memory.campaigns = {};
  memory.messages = {};
  memory.suppressions = [];
  memory.settings = null;
  memory.proprietors = {};
  memory.install_slots = {};
  memory.attendees = {};
  memory.reminders = {};
}
