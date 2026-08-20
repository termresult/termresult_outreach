import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { listCampaigns } from "@/lib/store/outreach";
import { BRAND } from "@/lib/color";

export default async function CampaignsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const campaigns = listCampaigns();

  return (
    <AppShell email={user.email}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow="Campaigns"
          title="Campaigns"
          description="Write once, queue to the schools who can receive that channel."
        />
        <Link
          href="/campaigns/new"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: BRAND }}
        >
          New campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-4 w-4" />}
          title="No campaigns yet"
          description="Create one for WhatsApp, SMS, or email. It will only be queued."
        />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-3 md:hidden">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <p className="text-sm font-bold text-slate-900">{campaign.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {campaign.channel} · {campaign.status} · {campaign.audience_count.toLocaleString()} schools
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-6 hidden overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Channel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Schools
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <Link href={`/campaigns/${campaign.id}`} className="font-medium text-slate-900 hover:underline">
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{campaign.channel}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">{campaign.status}</td>
                    <td className="px-4 py-3 text-slate-600">{campaign.audience_count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}
