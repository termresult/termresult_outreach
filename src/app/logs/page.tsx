import Link from "next/link";
import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader } from "@/components/ui/ds";
import { FormSelect } from "@/components/ui/form-select";
import { getSessionUser } from "@/lib/auth/session";
import { getContact } from "@/lib/store/contacts";
import { listCampaigns, listMessages } from "@/lib/store/outreach";
import type { MessageStatus } from "@/types/message";

const PAGE = 40;

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const raw = await searchParams;
  const status = typeof raw.status === "string" ? raw.status : "";
  const campaignId = typeof raw.campaign === "string" ? raw.campaign : "";
  const page = Math.max(1, Number(typeof raw.page === "string" ? raw.page : "1") || 1);

  const campaigns = listCampaigns();
  let rows = listMessages(campaignId || undefined);
  if (status) rows = rows.filter((row) => row.status === status);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const slice = rows.slice((page - 1) * PAGE, page * PAGE);

  return (
    <AppShell email={user.email}>
      <PageHeader
        eyebrow="Logs"
        title="Send log"
        description="Every queued row shows up here. In this phase they stay queued — nothing goes out."
      />

      <form method="get" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormSelect name="campaign" defaultValue={campaignId}>
          <option value="">All campaigns</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </FormSelect>
        <FormSelect name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {(["queued", "skipped", "sent", "failed", "sending"] as MessageStatus[]).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </FormSelect>
        <button
          type="submit"
          className="h-10 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm"
        >
          Apply
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-4 w-4" />}
          title="No log rows yet"
          description="Confirm a campaign and the queue will appear here."
        />
      ) : (
        <>
          <p className="mt-4 text-sm text-slate-500">
            Showing {slice.length} of {rows.length.toLocaleString()}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:hidden">
            {slice.map((row) => (
              <LogCard key={row.id} row={row} />
            ))}
          </div>
          <div className="mt-4 hidden overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    School
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Channel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {slice.map((row) => {
                  const contact = getContact(row.contact_id);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{contact?.name ?? row.contact_id}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">{row.channel}</td>
                      <td className="px-4 py-3 text-slate-600">{row.to ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusChip status={row.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 ? (
            <div className="mt-6 flex justify-between text-sm">
              <span className="text-slate-500">
                Page {page} of {pages}
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={logHref({ campaign: campaignId, status, page: page - 1 })}
                    className="h-10 rounded-full border border-slate-200 bg-white px-4 font-semibold leading-10 text-slate-700 shadow-sm"
                  >
                    Previous
                  </Link>
                ) : null}
                {page < pages ? (
                  <Link
                    href={logHref({ campaign: campaignId, status, page: page + 1 })}
                    className="h-10 rounded-full border border-slate-200 bg-white px-4 font-semibold leading-10 text-slate-700 shadow-sm"
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

function LogCard({
  row,
}: {
  row: { id: string; contact_id: string; channel: string; to: string | null; status: MessageStatus };
}) {
  const contact = getContact(row.contact_id);
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-slate-900">{contact?.name ?? row.contact_id}</p>
      <p className="mt-1 text-xs text-slate-500">
        {row.channel} · {row.to ?? "—"}
      </p>
      <div className="mt-2">
        <StatusChip status={row.status} />
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: MessageStatus }) {
  const tone =
    status === "sent"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : status === "failed"
        ? "bg-red-50 text-red-700 border-red-100"
        : status === "skipped"
          ? "bg-amber-50 text-amber-700 border-amber-100"
          : "bg-slate-50 text-slate-600 border-slate-100";
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize ${tone}`}>
      {status}
    </span>
  );
}

function logHref({ campaign, status, page }: { campaign: string; status: string; page: number }) {
  const params = new URLSearchParams();
  if (campaign) params.set("campaign", campaign);
  if (status) params.set("status", status);
  params.set("page", String(page));
  return `/logs?${params.toString()}`;
}
