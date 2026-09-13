import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { loadSettings } from "@/lib/plan-service";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");

  const settings = await loadSettings(user.id);

  return (
    <AppShell user={user} theme={settings.theme} timezone={settings.timezone}>
      {children}
    </AppShell>
  );
}
