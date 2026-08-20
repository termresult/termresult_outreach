import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader } from "@/components/ui/ds";
import { getSessionUser } from "@/lib/auth/session";

export async function StubPage({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <AppShell email={user.email}>
      <PageHeader eyebrow={title} title={title} description={description} />
      <EmptyState
        icon={icon}
        title="Coming in a later phase"
        description="This page is reserved so the app shape stays stable."
      />
    </AppShell>
  );
}
