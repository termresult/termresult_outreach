"use client";

import { BRAND, hexToRgba } from "@/lib/color";
import {
  formatInstallDay,
  isPastInstallDate,
  todayInLagos,
} from "@/lib/proprietors/install-date";
import type { Proprietor } from "@/types/proprietor";

function addDays(start: string, days: number): string {
  const [year, month, day] = start.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function InstallDateField({
  value,
  ownerId,
  rows,
  onChange,
}: {
  value: string;
  ownerId: string | null;
  rows: Proprietor[];
  onChange: (date: string) => void;
}) {
  const today = todayInLagos();
  const taken = new Map(
    rows
      .filter((row) => row.install_date)
      .map((row) => [row.install_date as string, row]),
  );
  const chips = Array.from({ length: 14 }, (_, index) => addDays(today, index));
  const owner = value ? taken.get(value) : undefined;
  const blocked = owner && owner.id !== ownerId;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Install date
        </span>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs font-semibold text-slate-500"
          >
            Clear
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value ? formatInstallDay(value) : "Not booked"}
      </p>
      {blocked ? (
        <p className="mt-1 text-xs font-semibold text-rose-700">
          {owner.install_booked_by || "Someone"} already booked {owner.school_name} on{" "}
          {formatInstallDay(value)}.
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">One school per day for the whole team.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((date) => {
          const holder = taken.get(date);
          const mine = holder?.id === ownerId;
          const locked = Boolean(holder) && !mine;
          const selected = value === date;
          return (
            <button
              key={date}
              type="button"
              disabled={locked}
              title={
                locked
                  ? `${holder?.install_booked_by} · ${holder?.school_name}`
                  : formatInstallDay(date)
              }
              onClick={() => onChange(date)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              style={
                selected
                  ? { backgroundColor: hexToRgba(BRAND, 0.08), color: BRAND }
                  : locked
                    ? { backgroundColor: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" }
                    : { backgroundColor: "#fff", color: "#475569", border: "1px solid #e2e8f0" }
              }
            >
              {formatInstallDay(date)}
              {locked ? ` · ${holder?.school_name}` : ""}
            </button>
          );
        })}
      </div>
      <input
        type="date"
        min={today}
        value={value && !isPastInstallDate(value) ? value : value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
      />
    </div>
  );
}
