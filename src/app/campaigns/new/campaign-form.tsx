"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FormSelect } from "@/components/ui/form-select";
import { BRAND, BRAND_DARK } from "@/lib/color";
import type { CampaignChannel } from "@/types/campaign";

type Preview = { id: string; name: string; to: string | null; body: string };

const DEFAULT_BODY =
  "Hello {{school_name}} in {{area}}. TermResult can help your school publish results without the usual stress.";

export function CampaignForm({ areas }: { areas: string[] }) {
  const router = useRouter();
  const [name, setName] = useState("FCT event WhatsApp");
  const [channel, setChannel] = useState<CampaignChannel>("whatsapp");
  const [body, setBody] = useState(DEFAULT_BODY);
  const [subject, setSubject] = useState("A note from TermResult");
  const [area, setArea] = useState("");
  const [source, setSource] = useState("");
  const [count, setCount] = useState(0);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audience = useMemo(
    () => ({
      filter: {
        has_phone: channel !== "email" ? true : undefined,
        has_email: channel === "email" ? true : undefined,
        areas: area ? [area] : [],
        source: source === "maps" || source === "directory" ? source : undefined,
      },
    }),
    [channel, area, source],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetch("/api/campaigns/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, audience, body }),
      })
        .then((res) => res.json())
        .then((data: { count?: number; previews?: Preview[] }) => {
          setCount(data.count ?? 0);
          setPreviews(data.previews ?? []);
        })
        .catch(() => undefined);
    }, 250);
    return () => clearTimeout(timer);
  }, [channel, audience, body]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          channel,
          audience,
          body,
          email_subject: channel === "email" ? subject : null,
          confirm: true,
        }),
      });
      const data = (await response.json()) as { campaign?: { id: string }; error?: string };
      if (!response.ok || !data.campaign) {
        setError(data.error ?? "Could not queue the campaign.");
        return;
      }
      router.push(`/campaigns/${data.campaign.id}`);
      router.refresh();
    } catch {
      setError("Could not queue the campaign.");
    } finally {
      setBusy(false);
    }
  }

  const channelLabel = channel === "whatsapp" ? "WhatsApp" : channel === "sms" ? "SMS" : "email";

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-5">
      <form
        className="space-y-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (confirmed) void submit();
        }}
      >
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Channel</span>
          <FormSelect
            className="mt-1"
            value={channel}
            onChange={(e) => setChannel(e.target.value as CampaignChannel)}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </FormSelect>
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Area</span>
            <FormSelect className="mt-1" value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">All areas</option>
              {areas.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FormSelect>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</span>
            <FormSelect className="mt-1" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">Any source</option>
              <option value="maps">Google Maps</option>
              <option value="directory">Directory</option>
            </FormSelect>
          </label>
        </div>

        {channel === "email" ? (
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Merge fields: {"{{school_name}}"}, {"{{area}}"}, {"{{owner_name}}"}, {"{{website}}"}
          </span>
        </label>

        {channel === "whatsapp" ? (
          <p className="text-xs leading-relaxed text-slate-500">
            WhatsApp will only send the approved template. Change that template in Twilio / Meta, not
            in this box. School name maps to variable 1.
          </p>
        ) : null}

        {channel === "email" ? (
          <p className="text-xs leading-relaxed text-slate-500">
            Email will later send one letter every 3 minutes, 400 a day. Nothing sends in this phase.
          </p>
        ) : null}

        <p className="text-sm font-bold text-slate-900">
          {count.toLocaleString()} schools will get this
        </p>

        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1"
          />
          Queue this for {count.toLocaleString()} schools on {channelLabel}. Nothing will be sent yet.
        </label>

        <button
          type="submit"
          disabled={busy || !confirmed || count < 1}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = BRAND_DARK;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = BRAND;
          }}
          style={{ backgroundColor: BRAND }}
          className="h-10 rounded-full px-6 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
        >
          {busy ? "Queuing…" : "Confirm and queue"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>

      <aside className="space-y-3 lg:col-span-2">
        <p className="text-sm font-bold text-slate-900">Preview</p>
        {previews.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-white p-5 text-sm text-slate-500 shadow-sm">
            No matching schools yet.
          </div>
        ) : (
          previews.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-900">{item.name}</p>
              <p className="mt-1 text-xs text-slate-500">{item.to ?? "No address"}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{item.body}</p>
            </div>
          ))
        )}
      </aside>
    </div>
  );
}
