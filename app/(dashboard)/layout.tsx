import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { QuickJobFab } from "@/components/jobs/quick-job-fab";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch tenant branding for theme injection
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, tenants(branding)")
    .eq("id", user.id)
    .single();

  const branding = (profile?.tenants as { branding?: unknown } | null)?.branding ?? null;

  return (
    <ThemeProvider branding={branding as Parameters<typeof ThemeProvider>[0]["branding"]}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/20 p-4 pb-20 md:p-6 md:pb-6">
            {children}
          </main>
        </div>
        <MobileNav />
        <QuickJobFab />
      </div>
    </ThemeProvider>
  );
}
