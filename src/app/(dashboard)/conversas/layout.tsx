import { Search } from "lucide-react";
import { getConversas } from "@/lib/data/conversas";
import { getStatusHumanoEmLote } from "@/lib/data/status-humano";
import { ConversaListItem } from "@/components/conversas/conversa-list-item";
import { AutoRefresh } from "@/components/conversas/auto-refresh";
import { ConversasShell } from "@/components/conversas/conversas-shell";

export const dynamic = "force-dynamic";

export default async function ConversasLayout({ children }: LayoutProps<"/conversas">) {
  const conversas = await getConversas();
  const statusPorTelefone = await getStatusHumanoEmLote(conversas.map((c) => c.phone));

  return (
    <ConversasShell
      lista={
        <>
          <AutoRefresh />
          <div className="flex w-full flex-col gap-3 px-[18px] pb-[14px] pt-[22px]">
            <h1 className="font-display text-[22px] font-semibold text-[var(--color-text-primary)]">Conversas</h1>
            <div className="flex h-8 w-full items-center gap-2 rounded-[6px] border border-[#363050] bg-[#1a1729] px-[10px]">
              <Search size={14} className="text-[var(--color-text-muted)]" />
              <span className="text-[11.5px] text-[var(--color-text-muted)]">Buscar por nome ou telefone</span>
            </div>
          </div>

          {conversas.length === 0 ? (
            <p className="px-[18px] py-6 text-[13px] text-[var(--color-text-muted)]">
              Nenhuma conversa registrada ainda.
            </p>
          ) : (
            conversas.map((c) => (
              <ConversaListItem
                key={c.conversationId}
                conversationId={c.conversationId}
                phone={c.phone}
                ultimaAtualizacao={c.ultimaAtualizacao}
                ultimaMensagem={c.ultimaMensagem}
                humano={statusPorTelefone.get(c.phone) ?? false}
                fotoUrl={c.fotoUrl}
                nomeCliente={c.nomeCliente}
              />
            ))
          )}
        </>
      }
    >
      {children}
    </ConversasShell>
  );
}
