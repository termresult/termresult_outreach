import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone, Mail, NotebookPen, Phone, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatCard } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { contactStats } from "@/lib/store/contacts";
import { campaignCount } from "@/lib/store/outreach";
import { proprietorStats } from "@/lib/store/proprietors";
import { BRAND } from "@/lib/color";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const stats = await contactStats();
  const campaigns = await campaignCount();
  const proprietors = await proprietorStats();
  const cards = [
    { label: "Schools", value: String(stats.schools), hint: "Imported so far", icon: Users },
    { label: "With phone", value: String(stats.with_phone), hint: "WhatsApp and SMS", icon: Phone },
    { label: "With email", value: String(stats.with_email), hint: "Gmail later", icon: Mail },
    { label: "Campaigns", value: String(campaigns), hint: campaigns ? "Queued, not sent" : "None yet", icon: Megaphone },
    {
      label: "Proprietors",
      value: String(proprietors.schools),
      hint: proprietors.already_talked
        ? `${proprietors.already_talked} already talked`
        : "Live conversation list",
      icon: NotebookPen,
    },
  ];

  return (
    <AppShell email={user.email}>
      <PageHeader
        eyebrow="Home"
        title="Outreach"
        description="Import the list, browse schools, then queue a campaign. Nothing is sent yet."
      />

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((stat) => {
          const Icon = stat.icon;
          return (
            <StatCard
              key={stat.label}
              icon={<Icon className="h-4 w-4" />}
              value={stat.value}
              label={stat.label}
              hint={stat.hint}
            />
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/proprietors"
          className="inline-flex h-10 items-center rounded-full px-6 text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: BRAND }}
        >
          Open proprietor tracker
        </Link>
        {stats.schools === 0 ? (
          <Link
            href="/import"
            className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm"
          >
            Import the school list
          </Link>
        ) : (
          <Link
            href="/contacts"
            className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm"
          >
            Browse contacts
          </Link>
        )}
      </div>
    </AppShell>
  );
}
