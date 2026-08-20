"use client";

import { useState } from "react";
import { BRAND, BRAND_DARK } from "@/lib/color";

export function SettingsForm({
  testPhone,
  testEmail,
  whatsappReady,
}: {
  testPhone: string;
  testEmail: string;
  whatsappReady: boolean;
}) {
  const [phone, setPhone] = useState(testPhone);
  const [email, setEmail] = useState(testEmail);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test_phone: phone, test_email: email }),
    });
    setBusy(false);
    setSaved(true);
  }

  return (
    <form
      className="mt-8 max-w-xl space-y-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <p className="text-sm leading-relaxed text-slate-600">
        First send of every channel goes to these test addresses. API keys stay in `.env.local`, not
        here.
      </p>
      <p
        className={`text-[11px] font-semibold uppercase tracking-wide ${whatsappReady ? "text-emerald-700" : "text-amber-700"}`}
      >
        {whatsappReady ? "WhatsApp / Twilio is configured" : "WhatsApp / Twilio is not configured"}
      </p>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Test phone</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0803… or +234…"
          className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Test email</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@termresult.com"
          className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = BRAND_DARK;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = BRAND;
        }}
        style={{ backgroundColor: BRAND }}
        className="h-10 rounded-full px-6 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save"}
      </button>
      {saved ? <p className="text-sm text-emerald-700">Saved.</p> : null}
    </form>
  );
}
