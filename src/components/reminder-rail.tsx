"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { ReminderPanel } from "@/components/reminder-panel";
import { BRAND } from "@/lib/color";
import { REMIND_EVENT, REMIND_OPEN_EVENT } from "@/lib/reminders/open";
import { isReminderOverdue } from "@/lib/reminders/when";
import type { Reminder } from "@/types/reminder";

const OPEN_KEY = "outreach_reminders_open";

export function ReminderRail() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const [badge, setBadge] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const saved = window.localStorage.getItem(OPEN_KEY);
    const nextWide = media.matches;
    setWide(nextWide);
    setOpen(saved == null ? nextWide : saved === "1");
    setReady(true);

    function onMedia() {
      setWide(media.matches);
    }
    media.addEventListener("change", onMedia);
    return () => media.removeEventListener("change", onMedia);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(OPEN_KEY, open ? "1" : "0");
  }, [open, ready]);

  useEffect(() => {
    function openRail() {
      setOpen(true);
    }
    window.addEventListener(REMIND_EVENT, openRail);
    window.addEventListener(REMIND_OPEN_EVENT, openRail);
    return () => {
      window.removeEventListener(REMIND_EVENT, openRail);
      window.removeEventListener(REMIND_OPEN_EVENT, openRail);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadBadge() {
      const res = await fetch("/api/reminders");
      if (!res.ok) return;
      const data = (await res.json()) as { reminders?: Reminder[] };
      if (!alive) return;
      const rows = data.reminders ?? [];
      const overdue = rows.filter((row) => !row.done && isReminderOverdue(row.due_at)).length;
      const openRows = rows.filter((row) => !row.done).length;
      setBadge(overdue || openRows);
    }
    void loadBadge();
    const timer = window.setInterval(() => void loadBadge(), 60_000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [open]);

  const panel = open ? <ReminderPanel compact onClose={() => setOpen(false)} /> : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-30 inline-flex h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white shadow-lg xl:hidden"
        style={{ backgroundColor: BRAND }}
      >
        <Bell className="h-4 w-4" />
        Reminders
        {badge ? (
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold" style={{ color: BRAND }}>
            {badge}
          </span>
        ) : null}
      </button>

      {ready && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed top-1/2 right-0 z-20 hidden -translate-y-1/2 rounded-l-xl border border-r-0 border-slate-200 bg-white px-2 py-4 text-xs font-semibold shadow-sm xl:flex"
          style={{ color: BRAND, writingMode: "vertical-rl" }}
        >
          Reminders{badge ? ` · ${badge}` : ""}
        </button>
      ) : null}

      {ready && open && !wide ? (
        <div className="fixed inset-0 z-40">
          <button type="button" aria-label="Close reminders" className="absolute inset-0 bg-slate-900/20" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-[360px] max-w-[92vw] flex-col bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)]">
            {panel}
          </aside>
        </div>
      ) : null}

      {ready && open && wide ? (
        <aside className="fixed inset-y-0 right-0 z-20 hidden w-96 border-l border-slate-100 bg-white xl:flex xl:flex-col">
          {panel}
        </aside>
      ) : null}

      {ready ? (
        <style>{`
          @media (min-width: 1280px) {
            .reminder-pad { padding-right: ${open ? "24rem" : "0"}; }
          }
        `}</style>
      ) : null}
    </>
  );
}
