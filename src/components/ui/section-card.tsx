import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { InfoTooltip } from "@/components/ui/info-tooltip";

type SectionCardProps = {
  icon: LucideIcon;
  title: string;
  action?: { label: string; href: string };
  /** Conteúdo livre no canto direito do header (ex: um botão de ação) — usado quando `action` (um Link simples) não serve. */
  headerExtra?: ReactNode;
  /** Texto curto explicando o que esse gráfico/lista representa — mostra um ícone de "i" clicável ao lado do título. */
  info?: string;
  className?: string;
  children: ReactNode;
};

export function SectionCard({ icon: Icon, title, action, headerExtra, info, className, children }: SectionCardProps) {
  return (
    <div
      className={
        "flex flex-col gap-2 rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] px-[18px] py-4 " +
        (className ?? "")
      }
    >
      <div className="flex w-full items-center gap-[9px] border-b border-[var(--color-border)] px-[18px] py-[14px]">
        <Icon size={16} strokeWidth={2} className="text-[var(--color-accent)]" />
        <h2 className="font-display text-[16px] font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {info && <InfoTooltip texto={info} />}
        <div className="h-px flex-1" />
        {action && (
          <Link href={action.href} className="text-[13px] font-medium text-[var(--color-accent)] hover:underline">
            {action.label}
          </Link>
        )}
        {headerExtra}
      </div>
      {children}
    </div>
  );
}
