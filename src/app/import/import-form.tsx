"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { BRAND, BRAND_DARK } from "@/lib/color";
import type { ImportSummary } from "@/lib/store/contacts";

export function ImportForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  async function send(body: BodyInit, headers?: HeadersInit) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/import", { method: "POST", body, headers });
      const data = (await response.json()) as ImportSummary & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Import failed.");
        return;
      }
      setSummary(data);
      router.refresh();
    } catch {
      setError("Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-900">FCT scrape already on this computer</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Reads the Abuja run from School Discovery. This is the full list — names, phones, emails,
          areas.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => send(JSON.stringify({ fromDisk: true }), { "Content-Type": "application/json" })}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = BRAND_DARK;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = BRAND;
          }}
          style={{ backgroundColor: BRAND }}
          className="mt-4 h-10 rounded-full px-6 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-60"
        >
          {busy ? "Importing…" : "Import FCT list"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-900">Or upload a file</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Accepts <span className="font-medium text-slate-900">contacts-live.csv</span> or{" "}
          <span className="font-medium text-slate-900">records.json</span>.
        </p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <Upload className="h-5 w-5 text-slate-400" />
          <span className="mt-2 text-sm font-semibold text-slate-700">Choose CSV or JSON</span>
          <input
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const form = new FormData();
              form.set("file", file);
              void send(form);
            }}
          />
        </label>
      </div>

      {error ? <p className="text-sm leading-relaxed text-red-600">{error}</p> : null}

      {summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ["Created", summary.created],
            ["Updated", summary.updated],
            ["Invalid", summary.invalid],
            ["With phone", summary.with_phone],
            ["With email", summary.with_email],
            ["Total now", summary.total],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
