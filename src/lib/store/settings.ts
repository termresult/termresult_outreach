import { adminDb } from "@/lib/firebase/admin";
import { memoryStore, useMemoryStore } from "@/lib/store/memory";

const SETTINGS_ID = "app";

export type OutreachSettings = {
  test_phone: string;
  test_email: string;
};

function emptySettings(): OutreachSettings {
  return {
    test_phone: process.env.OUTREACH_TEST_PHONE?.trim() ?? "",
    test_email: process.env.OUTREACH_TEST_EMAIL?.trim() ?? "",
  };
}

export async function getSettings(): Promise<OutreachSettings> {
  if (useMemoryStore()) {
    return { ...emptySettings(), ...(memoryStore().settings ?? {}) };
  }
  const snap = await adminDb().collection("settings").doc(SETTINGS_ID).get();
  return { ...emptySettings(), ...((snap.data() as Partial<OutreachSettings> | undefined) ?? {}) };
}

export async function saveSettings(next: Partial<OutreachSettings>): Promise<OutreachSettings> {
  const merged = { ...(await getSettings()), ...next };
  if (useMemoryStore()) {
    memoryStore().settings = merged;
    return merged;
  }
  await adminDb().collection("settings").doc(SETTINGS_ID).set(merged);
  return merged;
}
