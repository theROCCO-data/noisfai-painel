import { Search } from "lucide-react";
import { getConversas, contarNaoLidas } from "@/lib/data/conversas";
import { getStatusHumanoEmLote } from "@/lib/data/status-humano";
import { getConfirmacoesPendentesEmLote } from "@/lib/data/confirmacoes-gerente";
import { getUltimasLeituras, LANCAMENTO_NAO_LIDAS } from "@/lib/data/leitura";
import { listModelosMensagem } from "@/lib/data/modelos-mensagem";
import { getCurrentStaffUser } from "@/lib/auth";
import { ListaConversas, type ItemConversa } from "@/components/conversas/lista-conversas";
import { AutoRefresh } from "@/components/conversas/auto-refresh";
import { ConversasShell } from "@/components/conversas/conversas-shell";
import { NovaConversaDialog } from "@/components/conversas/nova-conversa-dialog";
import { ModelosMensagemManagerDialog } from "@/components/conversas/modelos-mensagem-manager-dialog";

export const dynamic = "force-dynamic";

// Conferir o status humano/IA bate um webhook no n8n por telefone. Medido
// ao vivo: o n8n não escala bem com paralelismo (10 chamadas simultâneas
// ~760ms, 40 ~1.8s, crescimento quase linear — é limite de concorrência do
// próprio n8n, não da rede) — então o número aqui importa mais que o
// esperado. 60 chegava a levar ~3s só nessa etapa (sentido pelo usuário
// principalmente depois de "Iniciar Atendimento", que força um refresh
// completo da lista via revalidatePath). Reduzido pra 20 (~1s) — a lista já
// vem ordenada por atualização, então é onde o status "humano/atenção"
// realmente importa; conversas antigas fora desse recorte mostram "IA" por
// padrão.
const LIMITE_STATUS_NA_LISTA = 20;

export default async function ConversasLayout({ children }: LayoutProps<"/conversas">) {
  const [conversas, modelos, staff] = await Promise.all([
    getConversas(),
    listModelosMensagem(),
    getCurrentStaffUser(),
  ]);
  const telefonesRecentes = conversas.slice(0, LIMITE_STATUS_NA_LISTA).map((c) => c.phone);
  const todosTelefones = conversas.map((c) => c.phone);

  // confirmações do gerente valem pra lista inteira (não só o topo) -- é só
  // uma consulta ao Supabase (barata), diferente do status humano/IA que
  // bate no n8n por telefone. Contagem exata de não lidas, por outro lado,
  // exige 1 chamada à Evolution por conversa -- só vale a pena pro topo.
  const naoLidasRecentes = conversas.slice(0, LIMITE_STATUS_NA_LISTA).filter((c) => c.naoLida);
  const [statusPorTelefone, confirmacoesPorTelefone, leiturasRecentes] = await Promise.all([
    getStatusHumanoEmLote(telefonesRecentes),
    getConfirmacoesPendentesEmLote(todosTelefones),
    getUltimasLeituras(naoLidasRecentes.map((c) => c.phone)),
  ]);
  const contagensNaoLidas = await Promise.all(
    naoLidasRecentes.map(async (c) => {
      const desde = leiturasRecentes.get(c.phone) ?? LANCAMENTO_NAO_LIDAS;
      const desdeReal = desde > LANCAMENTO_NAO_LIDAS ? desde : LANCAMENTO_NAO_LIDAS;
      return [c.phone, await contarNaoLidas(c.remoteJids, desdeReal)] as const;
    })
  );
  const contagemPorTelefone = new Map(contagensNaoLidas);

  const itens: ItemConversa[] = conversas.map((c) => ({
    ...c,
    status: statusPorTelefone.get(c.phone) ?? "ia",
    contagemNaoLidas: contagemPorTelefone.get(c.phone),
    confirmacaoGerenteTipo: confirmacoesPorTelefone.get(c.phone)?.tipo ?? null,
  }));

  return (
    <ConversasShell
      lista={
        <>
          {/* O gatilho principal agora é o Realtime (ver auto-refresh.tsx) --
              mensagem nova atualiza a tela na hora. Esse intervalo é só a
              rede de segurança pro caso do WebSocket cair; 5s/12s eram
              pesados demais pra essa tela quando ainda era o ÚNICO gatilho
              (cada tick busca a lista inteira ~970 chats na Evolution +
              status de várias conversas + o histórico da conversa aberta),
              e agora nem precisa mais ser tão frequente. */}
          <AutoRefresh intervalMs={20000} />
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

          <ListaConversas itens={itens} />
        </>
      }
    >
      {children}
    </ConversasShell>
  );
}
