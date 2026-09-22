import { Suspense, type ReactNode } from "react";
import { getConversas, contarNaoLidas, getFotosPerfilEmLote } from "@/lib/data/conversas";
import { getStatusHumanoEmLote } from "@/lib/data/status-humano";
import { getConfirmacoesPendentesEmLote } from "@/lib/data/confirmacoes-gerente";
import { getInteresseJantarHarmonizadoEmLote } from "@/lib/data/jantar-harmonizado";
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

/**
 * Cabeçalho da lista. Estático (não depende de dado remoto) — fica no
 * fallback do Suspense pra tela não aparecer vazia enquanto a lista carrega.
 */
function CabecalhoConversas({ acoes }: { acoes?: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-3 px-[18px] pb-[14px] pt-[22px]">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-[22px] font-semibold text-[var(--color-text-primary)]">Conversas</h1>
        <div className="flex shrink-0 items-center gap-2">{acoes}</div>
      </div>
    </div>
  );
}

/**
 * Toda a busca de dados da lista (getConversas via Evolution ~1s + status
 * humano/IA via n8n + fotos + contagem de não lidas). Fica ISOLADA num
 * componente async dentro de <Suspense> (ver layout) pra NÃO bloquear a
 * renderização da thread aberta: como o layout envolve os filhos, se esse
 * await acontecesse no corpo do layout, cada `router.refresh()` (inclusive o
 * disparado pelo Realtime a cada mensagem nova) só pintaria a thread depois
 * que a lista lenta terminasse -- era a causa do atraso de ~2s pra mensagem
 * nova aparecer. Isolada assim, a thread (que lê do banco, rápido) atualiza
 * na hora e a lista entra em streaming logo atrás.
 */
async function ListaConversasServer() {
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
  // só busca foto de quem a Evolution não já mandou de graça no findChats
  // (~92% dos casos, ver getFotosPerfilEmLote) -- e só entre os recentes,
  // mesmo recorte do status humano/IA, por ser 1 chamada à Evolution por número.
  const telefonesSemFoto = conversas
    .slice(0, LIMITE_STATUS_NA_LISTA)
    .filter((c) => !c.fotoUrl)
    .map((c) => c.phone);
  const [statusPorTelefone, confirmacoesPorTelefone, leiturasRecentes, fotosPorTelefone, interesseJHPorTelefone] = await Promise.all([
    getStatusHumanoEmLote(telefonesRecentes),
    getConfirmacoesPendentesEmLote(todosTelefones),
    getUltimasLeituras(naoLidasRecentes.map((c) => c.phone)),
    getFotosPerfilEmLote(telefonesSemFoto),
    getInteresseJantarHarmonizadoEmLote(todosTelefones),
  ]);
  const contagensNaoLidas = await Promise.all(
    naoLidasRecentes.map(async (c) => {
      const desde = leiturasRecentes.get(c.phone) ?? LANCAMENTO_NAO_LIDAS;
      const desdeReal = desde > LANCAMENTO_NAO_LIDAS ? desde : LANCAMENTO_NAO_LIDAS;
      return [c.phone, await contarNaoLidas(c.remoteJids, desdeReal)] as const;
    })
  );
  const contagemPorTelefone = new Map(contagensNaoLidas);

  const itens: ItemConversa[] = conversas.map((c) => {
    const jh = interesseJHPorTelefone.get(c.phone);
    return {
      ...c,
      fotoUrl: c.fotoUrl ?? fotosPorTelefone.get(c.phone) ?? null,
      status: statusPorTelefone.get(c.phone) ?? "ia",
      contagemNaoLidas: contagemPorTelefone.get(c.phone),
      confirmacaoGerenteTipo: confirmacoesPorTelefone.get(c.phone)?.tipo ?? null,
      interesseJantarHarmonizado: !!jh,
      jantarHarmonizadoConfirmado: jh?.confirmado ?? false,
    };
  });

  return (
    <>
      <CabecalhoConversas
        acoes={
          <>
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
          </>
        }
      />
      <ListaConversas itens={itens} />
    </>
  );
}

export default function ConversasLayout({ children }: LayoutProps<"/conversas">) {
  return (
    <ConversasShell
      lista={
        <>
          {/* O gatilho principal é o Realtime (ver auto-refresh.tsx) -- mensagem
              nova dispara router.refresh(). A lista fica num <Suspense> pra esse
              refresh não esperar a busca lenta dela (Evolution ~1s) antes de
              pintar a thread aberta (que lê do banco). Esse intervalo é só a
              rede de segurança pro caso do WebSocket cair. */}
          <AutoRefresh intervalMs={20000} />
          <Suspense fallback={<CabecalhoConversas />}>
            <ListaConversasServer />
          </Suspense>
        </>
      }
    >
      {children}
    </ConversasShell>
  );
}
