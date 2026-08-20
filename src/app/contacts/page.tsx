import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ChannelTicks } from "@/components/channel-ticks";
import { EmptyState, PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { filterContacts, PAGE_SIZE, parseContactQuery } from "@/lib/contacts/query";
import { listContacts } from "@/lib/store/contacts";
import { ContactsFilters } from "./contacts-filters";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const raw = await searchParams;
  const query = parseContactQuery(new URLSearchParams(
    Object.entries(raw).flatMap(([key, value]) => {
      if (typeof value === "string") return [[key, value]];
      return [];
    }),
  ));

  const all = listContacts().sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  const areas = [...new Set(all.map((c) => c.area).filter((area): area is string => Boolean(area)))].sort();
  const filtered = filterContacts(all, query);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(query.page ?? 1, pages);
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AppShell email={user.email}>
      <PageHeader
        eyebrow="Contacts"
        title="Schools"
        description="Search and filter the imported list. Nothing has been sent."
      />
      <p className="mt-3 text-sm text-slate-500">
        Showing {slice.length} of {filtered.length} schools
        {all.length !== filtered.length ? ` (filtered from ${all.length})` : ""}.
      </p>
      <ContactsFilters query={{ ...query, page }} areas={areas} />

      {all.length === 0 ? (
        <EmptyState
          icon={<Users className="h-4 w-4" />}
          title="No schools yet"
          description="Import the FCT scrape first."
        />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-3 md:hidden">
            {slice.map((contact) => (
              <Link
                key={contact.id}
                href={`/contacts/${encodeURIComponent(contact.id)}`}
                className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <p className="text-sm font-bold text-slate-900">{contact.name}</p>
                <p className="mt-1 text-xs text-slate-500">{contact.area ?? "No area"}</p>
                <p className="mt-2 text-sm text-slate-600">{contact.phone_e164 ?? "No phone"}</p>
                <p className="text-sm text-slate-600">{contact.email ?? "No email"}</p>
                <div className="mt-3">
                  <ChannelTicks {...contact.channels} />
                </div>
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
                    Area
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Channels
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {slice.map((contact) => (
                  <tr key={contact.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/contacts/${encodeURIComponent(contact.id)}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {contact.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{contact.area ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{contact.phone_e164 ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{contact.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <ChannelTicks {...contact.channels} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 ? (
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Page {page} of {pages}
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={pageHref(query, page - 1)}
                    className="h-10 rounded-full border border-slate-200 bg-white px-4 font-semibold leading-10 text-slate-700 shadow-sm"
                  >
                    Previous
                  </Link>
                ) : null}
                {page < pages ? (
                  <Link
                    href={pageHref(query, page + 1)}
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

function pageHref(query: ReturnType<typeof parseContactQuery>, page: number) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.phone) params.set("phone", query.phone);
  if (query.email) params.set("email", query.email);
  if (query.source) params.set("source", query.source);
  if (query.area) params.set("area", query.area);
  params.set("page", String(page));
  return `/contacts?${params.toString()}`;
}
