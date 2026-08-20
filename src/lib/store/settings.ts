import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DATA_PATH = resolve(process.cwd(), ".data/settings.json");

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

export function getSettings(): OutreachSettings {
  try {
    return { ...emptySettings(), ...(JSON.parse(readFileSync(DATA_PATH, "utf8")) as OutreachSettings) };
  } catch {
    return emptySettings();
  }
}

export function saveSettings(next: Partial<OutreachSettings>): OutreachSettings {
  const merged = { ...getSettings(), ...next };
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  return merged;
}
