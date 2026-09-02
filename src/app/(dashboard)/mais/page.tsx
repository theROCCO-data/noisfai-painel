import Link from "next/link";
import { BarChart3, Users, SlidersHorizontal, BookOpen, ShoppingBag, Settings, ChevronRight } from "lucide-react";
import { getCurrentStaffUser } from "@/lib/auth";
import { SairButton } from "@/components/configuracoes/sair-button";

export const dynamic = "force-dynamic";

const ITENS = [
  { href: "/analises", label: "Análises", icon: BarChart3 },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/capacidade", label: "Capacidade", icon: SlidersHorizontal },
  { href: "/cardapio", label: "Cardápio", icon: BookOpen },
  { href: "/ifood", label: "iFood", icon: ShoppingBag },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function MaisPage() {
  const user = await getCurrentStaffUser();

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-[24px] font-semibold text-[var(--color-text-primary)]">Mais</h1>

      {user && (
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 rounded-[20px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-4"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[rgba(168,85,247,0.32)] bg-[#1d1436]">
            <span className="text-[13px] font-semibold text-[#d8b4fe]">{initials(user.name)}</span>
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">{user.name}</span>
            <span className="text-[12px] text-[var(--color-text-muted)]">{user.role}</span>
          </div>
          <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
        </Link>
      )}

      <div className="overflow-hidden rounded-[20px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)]">
        {ITENS.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-white/5" : ""}`}
            >
              <Icon size={18} className="text-[var(--color-text-muted)]" />
              <span className="flex-1 text-[13.5px] font-medium text-[var(--color-text-primary)]">{item.label}</span>
              <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
            </Link>
          );
        })}
      </div>

      <SairButton />
    </div>
  );
}
