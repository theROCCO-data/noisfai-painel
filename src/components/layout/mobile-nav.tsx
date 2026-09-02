"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, CalendarCheck, Wine, MoreHorizontal, type LucideIcon } from "lucide-react";

type ItemNav = { href: string; label: string; icon: LucideIcon };

const ITENS: ItemNav[] = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/conversas", label: "Conversas", icon: MessageCircle },
  { href: "/reservas", label: "Reservas", icon: CalendarCheck },
  { href: "/jantar-harmonizado", label: "Jantar", icon: Wine },
  { href: "/mais", label: "Mais", icon: MoreHorizontal },
];

export function MobileNav({ conversasAbertas = 0 }: { conversasAbertas?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[var(--color-border-soft)] bg-gradient-to-t from-[#0a0613] to-[var(--color-card-from)] px-2 pb-[max(6px,env(safe-area-inset-bottom))] pt-2 lg:hidden">
      {ITENS.map((item) => {
        const active = item.href === "/mais" ? pathname === "/mais" : pathname?.startsWith(item.href);
        const Icon = item.icon;
        const badge = item.href === "/conversas" ? conversasAbertas : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={
              active
                ? "relative flex flex-1 flex-col items-center gap-0.5 rounded-[14px] bg-gradient-to-b from-[rgba(168,85,247,0.24)] to-[rgba(124,58,237,0.08)] py-1.5 text-[#e9d5ff]"
                : "relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[var(--color-text-muted)]"
            }
          >
            <Icon size={20} strokeWidth={2} />
            <span className="text-[10.5px] font-medium">{item.label}</span>
            {badge > 0 && (
              <span className="absolute right-[18%] top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[var(--color-status-amber)] px-[3px] text-[9px] font-bold text-[#2a1a00]">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
