"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND, BRAND_DARK } from "@/lib/color";

export function LoginButton() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/session", { method: "POST" });
      if (!response.ok) {
        setError("Could not start a session.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Could not start a session.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        onClick={signIn}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = BRAND_DARK;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = BRAND;
        }}
        style={{ backgroundColor: BRAND }}
        className="h-11 w-full rounded-full text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-60"
      >
        {busy ? "Opening…" : "Continue"}
      </button>
      <p className="text-xs leading-relaxed text-slate-500">
        Google sign-in is paused. This opens the app as the official TermResult mailbox.
      </p>
      {error ? <p className="text-sm leading-relaxed text-red-600">{error}</p> : null}
    </div>
  );
}
