import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { getContact } from "@/lib/store/contacts";
import { getCampaign, listMessages } from "@/lib/store/outreach";
import { getSettings } from "@/lib/store/settings";
import { isGmailConfigured } from "@/lib/send/email-gmail";
import { isWhatsAppConfigured } from "@/lib/send/whatsapp-twilio";
import { EmailActions } from "./email-actions";
import { RunActions } from "./run-actions";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const messages = await listMessages(campaign.id);
  const queued = messages.filter((row) => row.status === "queued").length;
  const sample = messages.slice(0, 5);
  const settings = await getSettings();
  const sampleContacts = await Promise.all(sample.map((row) => getContact(row.contact_id)));

  return (
    <AppShell email={user.email}>
      <Link href="/campaigns" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
        Back to campaigns
      </Link>
      <div className="mt-4">
        <PageHeader
          title={campaign.name}
          description={`${campaign.channel} · ${campaign.status} · ${campaign.audience_count.toLocaleString()} schools in the audience`}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Template</p>
        {campaign.email_subject ? (
          <p className="mt-2 text-sm font-bold text-slate-900">{campaign.email_subject}</p>
        ) : null}
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {campaign.template.body}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-900">{messages.length.toLocaleString()}</p>
          <p className="text-xs font-semibold text-slate-500">Queued rows</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-900">{queued.toLocaleString()}</p>
          <p className="text-xs font-semibold text-slate-500">Still queued</p>
        </div>
      </div>

      {campaign.channel === "whatsapp" ? (
        <RunActions
          campaignId={campaign.id}
          queued={queued}
          whatsappReady={isWhatsAppConfigured()}
          testPhone={settings.test_phone}
        />
      ) : campaign.channel === "email" ? (
        <EmailActions
          campaignId={campaign.id}
          queued={queued}
          status={campaign.status}
          gmailReady={isGmailConfigured()}
          testEmail={settings.test_email}
        />
      ) : (
        <p className="mt-6 text-sm text-slate-500">
          SMS stays off until the Termii phase. This campaign is queued only.
        </p>
      )}
      <Link href={`/logs?campaign=${campaign.id}`} className="mt-4 inline-block text-sm font-semibold hover:underline" style={{ color: "#2563EB" }}>
        Open the send log
      </Link>

      <div className="mt-6 space-y-3">
        {sample.map((row, index) => {
          const contact = sampleContacts[index];
          return (
            <div key={row.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-900">{contact?.name ?? row.contact_id}</p>
              <p className="mt-1 text-xs text-slate-500">
                {row.to} · {row.status}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{row.body_rendered}</p>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
