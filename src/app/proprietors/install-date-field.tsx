"use client";

import { useState } from "react";
import Link from "next/link";
import { formatInstallDay, todayInLagos } from "@/lib/proprietors/install-date";
import type { Proprietor } from "@/types/proprietor";
import { InstallMonthGrid } from "./install-month-grid";

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
  const owner = value ? taken.get(value) : undefined;
  const blocked = owner && owner.id !== ownerId;
  const [year, month] = (value || today).split("-").map(Number);
  const [cursor, setCursor] = useState({ year, month });

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Check free dates
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
        {value ? `Install ${formatInstallDay(value)}` : "Pick a free day"}
      </p>
      {blocked ? (
        <p className="mt-1 text-xs font-semibold text-rose-700">
          {owner.install_booked_by || "Someone"} already booked {owner.school_name} on{" "}
          {formatInstallDay(value)}.
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">
          Green is free. Blue is already taken. Tap a free day, then save.
        </p>
      )}
      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
        <InstallMonthGrid
          year={cursor.year}
          month={cursor.month}
          today={today}
          booked={taken}
          selected={value}
          ownerId={ownerId}
          onMonthChange={setCursor}
          onSelect={onChange}
        />
      </div>
      <Link href="/proprietors/calendar" className="mt-2 inline-block text-xs font-semibold text-slate-500">
        Open the full calendar
      </Link>
    </div>
  );
}
