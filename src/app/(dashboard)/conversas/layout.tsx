import { Search } from "lucide-react";
import { getConversas } from "@/lib/data/conversas";
import { getStatusHumanoEmLote } from "@/lib/data/status-humano";
import { listModelosMensagem } from "@/lib/data/modelos-mensagem";
import { getCurrentStaffUser } from "@/lib/auth";
import { ConversaListItem } from "@/components/conversas/conversa-list-item";
import { AutoRefresh } from "@/components/conversas/auto-refresh";
import { ConversasShell } from "@/components/conversas/conversas-shell";
import { NovaConversaDialog } from "@/components/conversas/nova-conversa-dialog";
import { ModelosMensagemManagerDialog } from "@/components/conversas/modelos-mensagem-manager-dialog";

export const dynamic = "force-dynamic";

// Conferir o status humano/IA bate um webhook no n8n por telefone — com a
// Evolution API agora expondo o histórico real (~900+ conversas, contra a
// base quebrada do Supabase de antes, que mostrava muito menos), checar TODA
// a lista a cada abertura/auto-refresh vira uma tempestade de requisições
// que deixa a tela inteira lenta (foi exatamente o mesmo tipo de incidente
// já registrado antes, só que agora com a lista completa). Limita a
// checagem às conversas mais recentes — a lista já vem ordenada por
// atualização, então é onde o status "humano/atenção" realmente importa;
// conversas antigas fora desse recorte mostram "IA" por padrão.
const LIMITE_STATUS_NA_LISTA = 60;

export default async function ConversasLayout({ children }: LayoutProps<"/conversas">) {
  const [conversas, modelos, staff] = await Promise.all([
    getConversas(),
    listModelosMensagem(),
    getCurrentStaffUser(),
  ]);
  const telefonesRecentes = conversas.slice(0, LIMITE_STATUS_NA_LISTA).map((c) => c.phone);
  const statusPorTelefone = await getStatusHumanoEmLote(telefonesRecentes);

  return (
    <ConversasShell
      lista={
        <>
          <AutoRefresh />
          <div className="flex w-full flex-col gap-3 px-[18px] pb-[14px] pt-[22px]">
            <div className="flex items-center justify-between gap-2">
              <h1 className="font-display text-[22px] font-semibold text-[var(--color-text-primary)]">Conversas</h1>
              <div className="flex shrink-0 items-center gap-2">
                <ModelosMensagemManagerDialog modelos={modelos} />
                <NovaConversaDialog
                  modelos={modelos}
                  nomeAtendente={staff?.name ?? "Equipe"}
                  trigger={
                    <span
                      title="Nova conversa"
                      className="flex size-[28px] shrink-0 items-center justify-center rounded-[10px] text-white shadow-[0px_10px_22px_-12px_rgba(168,85,247,0.6)]"
                      style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
                    >
                      <span className="text-[16px] leading-none">+</span>
                    </span>
                  }
                />
              </div>
            </div>
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
                key={c.phone}
                phone={c.phone}
                ultimaAtualizacao={c.ultimaAtualizacao}
                ultimaMensagem={c.ultimaMensagem}
                status={statusPorTelefone.get(c.phone) ?? "ia"}
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
