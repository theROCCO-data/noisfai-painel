"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  MessageCircle,
  CalendarCheck,
  Wine,
  SlidersHorizontal,
  BookOpen,
  ShoppingBag,
  Users,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/lib/auth-actions";
import { LogoUploadButton } from "@/components/layout/logo-upload-button";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/analises", label: "Análises", icon: BarChart3 },
  { href: "/conversas", label: "Conversas", icon: MessageCircle },
  { href: "/reservas", label: "Reservas", icon: CalendarCheck },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/jantar-harmonizado", label: "Jantar Harmonizado", icon: Wine },
  { href: "/capacidade", label: "Capacidade", icon: SlidersHorizontal },
  { href: "/cardapio", label: "Cardápio", icon: BookOpen },
  { href: "/ifood", label: "iFood", icon: ShoppingBag },
];

type SidebarProps = {
  userName: string;
  userRole: string;
  conversasAbertas?: number;
  logoUrl?: string | null;
  avatarUrl?: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Sidebar({ userName, userRole, conversasAbertas = 0, logoUrl = null, avatarUrl = null }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[236px] shrink-0 flex-col gap-[2px] overflow-clip rounded-tr-[28px] rounded-br-[28px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[#0a0613] px-[10px] py-[18px]">
      <div className="flex items-center gap-[10px] overflow-clip px-[8px] pb-[22px]">
        <LogoUploadButton logoUrl={logoUrl} />
        <div className="flex flex-col gap-px whitespace-nowrap">
          <span className="font-display text-[14.5px] font-semibold text-[var(--color-text-primary)]">
            Painel NOI
          </span>
          <span className="text-[11.5px] text-[var(--color-text-muted)]">São Francisco</span>
        </div>
      </div>

      <nav className="flex w-full flex-col gap-[2px]">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          const badge = item.href === "/conversas" ? conversasAbertas : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={
                active
                  ? "flex h-[34px] w-full items-center gap-[10px] rounded-[14px] border border-[rgba(168,85,247,0.32)] bg-gradient-to-r from-[rgba(168,85,247,0.24)] to-[rgba(124,58,237,0.08)] px-[10px] shadow-[0px_10px_26px_-16px_rgba(168,85,247,0.5)]"
                  : "flex h-[34px] w-full items-center gap-[10px] rounded-[14px] px-[10px] hover:bg-white/[0.03]"
              }
            >
              <Icon
                size={18}
                strokeWidth={2}
                className={active ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}
              />
              <span
                className={
                  active
                    ? "whitespace-nowrap text-[13px] font-medium text-[var(--color-text-primary)]"
                    : "whitespace-nowrap text-[13px] font-medium text-[var(--color-text-muted)]"
                }
              >
                {item.label}
              </span>
              {badge > 0 && (
                <span className="flex h-[18px] shrink-0 items-center justify-center rounded-[999px] bg-[var(--color-status-amber)] px-[7px] font-display text-[11px] font-semibold text-[#2a1a00] tracking-[0.11px]">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="min-h-px w-px flex-1" />

      <div className="flex w-full items-center gap-[9px] overflow-clip border-t border-[var(--color-border)] px-[8px] pt-[10px]">
        <Link
          href="/configuracoes"
          prefetch={false}
          className={
            pathname === "/configuracoes"
              ? "flex flex-1 items-center gap-[9px] overflow-clip rounded-[12px] bg-white/[0.05] p-1"
              : "flex flex-1 items-center gap-[9px] overflow-clip rounded-[12px] p-1 hover:bg-white/[0.03]"
          }
        >
          <div className="relative flex size-[26px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[rgba(168,85,247,0.32)] bg-[#1d1436]">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill sizes="26px" className="object-cover" unoptimized />
            ) : (
              <span className="text-[11px] font-semibold text-[#d8b4fe]">{initials(userName)}</span>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-px whitespace-nowrap">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{userName}</span>
            <span className="text-[11.5px] text-[var(--color-text-muted)]">{userRole}</span>
          </div>
        </Link>
        <button
          onClick={() => signOut()}
          title="Sair"
          className="flex size-6 shrink-0 items-center justify-center rounded-[8px] text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text-primary)]"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
