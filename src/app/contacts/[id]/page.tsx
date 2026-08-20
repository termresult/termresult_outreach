import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ChannelTicks } from "@/components/channel-ticks";
import { PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { getContact } from "@/lib/store/contacts";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const contact = getContact(decodeURIComponent(id));
  if (!contact) notFound();

  const rows = [
    ["Area", contact.area],
    ["Address", contact.address],
    ["Phone", contact.phone_e164],
    ["Phone as imported", contact.phone_raw],
    ["Email", contact.email],
    ["Owner", contact.owner_name],
    ["Source", contact.source === "maps" ? "Google Maps" : "Directory"],
    ["Place id", contact.source_place_id],
  ];

  return (
    <AppShell email={user.email}>
      <Link href="/contacts" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
        Back to contacts
      </Link>
      <div className="mt-4">
        <PageHeader title={contact.name ?? "Unnamed school"} description={contact.address ?? undefined} />
      </div>
      <div className="mt-6">
        <ChannelTicks {...contact.channels} />
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <dl className="divide-y divide-slate-50">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="text-sm text-slate-900 sm:col-span-2">{value || "—"}</dd>
            </div>
          ))}
          <div className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Website</dt>
            <dd className="text-sm sm:col-span-2">
              {contact.website ? (
                <a
                  href={contact.website}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold hover:underline"
                  style={{ color: "#2563EB" }}
                >
                  {contact.website}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">All emails</dt>
            <dd className="text-sm text-slate-900 sm:col-span-2">
              {contact.emails.length ? contact.emails.join(", ") : "—"}
            </dd>
          </div>
        </dl>
      </div>
    </AppShell>
  );
}
