import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";
import { isGmailConfigured } from "@/lib/send/email-gmail";
import { isWhatsAppConfigured } from "@/lib/send/whatsapp-twilio";
import { getSettings } from "@/lib/store/settings";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const settings = await getSettings();

  return (
    <AppShell email={user.email}>
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        description="Test addresses live here. Twilio and Gmail keys stay on the server."
      />
      <SettingsForm
        testPhone={settings.test_phone}
        testEmail={settings.test_email}
        whatsappReady={isWhatsAppConfigured()}
        gmailReady={isGmailConfigured()}
      />
    </AppShell>
  );
}
