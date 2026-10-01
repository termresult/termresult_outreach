"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND, BRAND_DARK } from "@/lib/color";

export function EmailActions({
  campaignId,
  queued,
  status,
  gmailReady,
  testEmail,
}: {
  campaignId: string;
  queued: number;
  status: string;
  gmailReady: boolean;
  testEmail: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"test" | "start" | "pause" | "resume" | "tick" | null>(null);
  const [realList, setRealList] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post(body: Record<string, unknown>, kind: typeof busy) {
    setBusy(kind);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        error?: string;
        status?: string;
        sent?: number;
        left_queued?: number;
        reason?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Request failed.");
        return;
      }
      if (kind === "tick") {
        if (data.sent) setMessage(`Sent one. ${data.left_queued ?? 0} still queued.`);
        else setMessage(data.reason === "gap" ? "Waiting for the 3-minute gap." : data.reason === "daily_cap" ? "Daily cap reached. Resumes tomorrow." : "No email sent this tick.");
        return;
      }
      if (kind === "pause") setMessage("Paused. Cron will skip this campaign.");
      else if (kind === "resume") setMessage("Resumed. Cron will send the next email when the gap allows.");
      else setMessage("Campaign is running. One email every 3 minutes, 400 a day.");
    } catch {
      setError("Request failed.");
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

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
      setMessage(`Test sent to ${data.to}. Check that inbox.`);
    } catch {
      setError("Test send failed.");
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-900">Email send</p>
      <p className="text-sm leading-relaxed text-slate-600">
        Sends as <span className="font-semibold">admin@termresult.com</span> through Gmail. One school
        per letter, one every 3 minutes, 400 a day (Africa/Lagos). Cron keeps going until the queue is
        empty.
      </p>
      {!gmailReady ? (
        <p className="text-sm text-amber-700">
          Gmail is not configured. Finish the Google Auth client, then run `pnpm gmail:oauth` and add
          the refresh token to `.env.local`.
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy !== null || !gmailReady}
        onClick={() => void testSend()}
        className="h-10 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"
      >
        {busy === "test" ? "Sending test…" : `Send test to ${testEmail || "my email"}`}
      </button>
      {status !== "running" ? (
        <>
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={realList}
              onChange={(e) => setRealList(e.target.checked)}
              className="mt-1"
            />
            This is the real list. Start the throttled send.
          </label>
          <button
            type="button"
            disabled={busy !== null || !gmailReady || !realList || queued < 1}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = BRAND_DARK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = BRAND;
            }}
            style={{ backgroundColor: BRAND }}
            onClick={() => void post({ realList: true }, status === "paused" ? "resume" : "start")}
            className="h-10 rounded-full px-6 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {busy === "start" || busy === "resume"
              ? "Starting…"
              : status === "paused"
                ? "Resume sending"
                : `Start sending to ${queued.toLocaleString()} schools`}
          </button>
        </>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void post({ pause: true }, "pause")}
            className="h-10 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"
          >
            {busy === "pause" ? "Pausing…" : "Pause"}
          </button>
          <button
            type="button"
            disabled={busy !== null || queued < 1}
            onClick={() => void post({ tick: true }, "tick")}
            className="h-10 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"
          >
            {busy === "tick" ? "Sending…" : "Send next now"}
          </button>
        </div>
      )}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
