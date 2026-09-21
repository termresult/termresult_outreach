export const REMIND_EVENT = "outreach-remind";
export const REMIND_OPEN_EVENT = "outreach-remind-open";

export type RemindPrefill = {
  school_id: string;
  school_name: string;
  school_source: "proprietor" | "attendee";
  phone: string | null;
};

export function requestRemind(detail: RemindPrefill) {
  window.dispatchEvent(new CustomEvent(REMIND_EVENT, { detail }));
}

export function openReminderRail() {
  window.dispatchEvent(new CustomEvent(REMIND_OPEN_EVENT));
}
