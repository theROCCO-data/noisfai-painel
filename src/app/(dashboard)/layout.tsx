import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileTopBar } from "@/components/layout/mobile-topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BackgroundGlow } from "@/components/layout/background-glow";
import { getCurrentStaffUser } from "@/lib/auth";
import { getConfiguracoes } from "@/lib/data/configuracoes";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const [user, config] = await Promise.all([getCurrentStaffUser(), getConfiguracoes()]);
  // não deveria acontecer (middleware já barra), mas mantém o TS são e cobre a corrida de sessão expirada
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen items-start overflow-hidden bg-[var(--color-bg)]">
      <div className="hidden lg:flex lg:h-full">
        <Sidebar userName={user.name} userRole={user.role} logoUrl={config.logoUrl} avatarUrl={user.avatarUrl} />
      </div>
      <div className="relative flex h-full flex-1 flex-col overflow-hidden">
        <BackgroundGlow />
        <MobileTopBar logoUrl={config.logoUrl} userName={user.name} avatarUrl={user.avatarUrl} />
        <main className="relative flex-1 overflow-x-hidden overflow-y-auto px-4 pb-24 pt-5 lg:overflow-x-visible lg:px-9 lg:py-[30px] lg:pb-[30px]">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
