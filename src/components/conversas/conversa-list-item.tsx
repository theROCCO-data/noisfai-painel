"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatTelefoneBR, formatHora } from "@/lib/format";
import { AvatarConversa } from "@/components/conversas/avatar-conversa";

export function ConversaListItem({
  conversationId,
  phone,
  ultimaAtualizacao,
  ultimaMensagem,
  humano,
  fotoUrl,
  nomeCliente,
}: {
  conversationId: string;
  phone: string;
  ultimaAtualizacao: string;
  ultimaMensagem: string;
  humano: boolean;
  fotoUrl: string | null;
  nomeCliente: string | null;
}) {
  const pathname = usePathname();
  const ativo = pathname === `/conversas/${conversationId}`;
  const label = nomeCliente || formatTelefoneBR(phone);

  return (
    <Link
      href={`/conversas/${conversationId}`}
      prefetch={false}
      className={
        ativo
          ? "flex w-full items-start gap-[10px] rounded-[18px] border border-[rgba(168,85,247,0.3)] px-[18px] py-3"
          : "flex w-full items-start gap-[10px] rounded-[18px] px-[18px] py-3 hover:bg-white/[0.03]"
      }
      style={
        ativo
          ? {
              backgroundImage:
                "linear-gradient(90deg, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0) 100%), linear-gradient(90deg, #1d1436 0%, #1d1436 100%)",
            }
          : undefined
      }
    >
      <AvatarConversa phone={phone} fotoUrl={fotoUrl} size={32} radius={12} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex w-full items-start">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{label}</p>
          <div className="h-px min-w-px flex-1" />
          <span className="text-[11.5px] font-display text-[var(--color-text-muted)]">{formatHora(ultimaAtualizacao)}</span>
        </div>
        <p className="line-clamp-1 text-[11.5px] text-[var(--color-text-muted)]">{ultimaMensagem || "—"}</p>
        <span
          className={`w-fit rounded-[11px] px-[9px] py-0.5 text-[11px] font-semibold ${
            humano
              ? "bg-[rgba(251,191,36,0.13)] text-[var(--color-status-amber)]"
              : "bg-[rgba(96,165,250,0.13)] text-[#60a5fa]"
          }`}
        >
          {humano ? "HUMANO" : "IA"}
        </span>
      </div>
    </Link>
  );
}
