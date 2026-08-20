"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND, BRAND_DARK } from "@/lib/color";

export function RunActions({
  campaignId,
  queued,
  whatsappReady,
  testPhone,
}: {
  campaignId: string;
  queued: number;
  whatsappReady: boolean;
  testPhone: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"test" | "run" | null>(null);
  const [realList, setRealList] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function testSend() {
    setBusy("test");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/test`, { method: "POST" });
      const data = (await response.json()) as { error?: string; to?: string };
      if (!response.ok) {
        setError(data.error ?? "Test send failed.");
        return;
      }
      setMessage(`Test sent to ${data.to}. Check WhatsApp.`);
    } catch {
      setError("Test send failed.");
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  async function runAll() {
    setBusy("run");
    setError(null);
    setMessage(null);
    let left = queued;
    let sent = 0;
    let failed = 0;
    try {
      while (left > 0) {
        const response = await fetch(`/api/campaigns/${campaignId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ realList: true }),
        });
        const data = (await response.json()) as {
          error?: string;
          left_queued?: number;
          sent?: number;
          failed?: number;
        };
        if (!response.ok) {
          setError(data.error ?? "Could not run the campaign.");
          return;
        }
        sent += data.sent ?? 0;
        failed += data.failed ?? 0;
        left = data.left_queued ?? 0;
        setMessage(`Sent ${sent.toLocaleString()}. ${left.toLocaleString()} still queued.`);
      }
      setMessage(`Done. Sent ${sent.toLocaleString()}${failed ? `, ${failed} failed` : ""}.`);
    } catch {
      setError("Could not run the campaign.");
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-900">WhatsApp send</p>
      <p className="text-sm leading-relaxed text-slate-600">
        WhatsApp only sends the approved Meta template. Change that template in Twilio / Meta, not in
        the text box. Send a test first.
      </p>
      {!whatsappReady ? (
        <p className="text-sm text-amber-700">
          Twilio is not configured. Add the account SID, auth token, and WhatsApp from-number in
          `.env.local`.
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy !== null || !whatsappReady}
        onClick={() => void testSend()}
        className="h-10 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"
      >
        {busy === "test" ? "Sending test…" : `Send test to ${testPhone || "my phone"}`}
      </button>
      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={realList}
          onChange={(e) => setRealList(e.target.checked)}
          className="mt-1"
        />
        This is the real list. Send to everyone still queued.
      </label>
      <button
        type="button"
        disabled={busy !== null || !whatsappReady || !realList || queued < 1}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = BRAND_DARK;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = BRAND;
        }}
        style={{ backgroundColor: BRAND }}
        onClick={() => void runAll()}
        className="h-10 rounded-full px-6 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
      >
        {busy === "run" ? "Sending…" : `Send to ${queued.toLocaleString()} schools`}
      </button>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
