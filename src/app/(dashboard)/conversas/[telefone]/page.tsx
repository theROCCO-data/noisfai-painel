import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserRound, AlertCircle, BellRing } from "lucide-react";
import { getConversa } from "@/lib/data/conversas";
import { formatTelefoneBR } from "@/lib/format";
import { getStatusHumano } from "@/lib/data/status-humano";
import { listModelosMensagem } from "@/lib/data/modelos-mensagem";
import { getCurrentStaffUser } from "@/lib/auth";
import { marcarComoLida } from "@/lib/data/leitura";
import { getConfirmacoesPendentesEmLote } from "@/lib/data/confirmacoes-gerente";
import { rotuloConfirmacao, parseDetalheGrupoGrande } from "@/lib/confirmacoes-gerente-shared";
import { listUsuarios } from "@/lib/data/usuarios";
import { ConfirmarPendenciaButton } from "@/components/conversas/confirmar-pendencia-button";
import { ConfirmarGrupoGrandeForm } from "@/components/conversas/confirmar-grupo-grande-form";
import { ToggleAtendimentoHumano } from "@/components/conversas/toggle-atendimento-humano";
import { Composer } from "@/components/conversas/composer";
import { PerfilContatoDialog } from "@/components/conversas/perfil-contato-dialog";
import { AvatarConversa } from "@/components/conversas/avatar-conversa";
import { ListaMensagens } from "@/components/conversas/lista-mensagens";

export const dynamic = "force-dynamic";

/**
 * O toggle IA/humano depende do status (webhook n8n, ~0,4-1,4s). Fica em
 * <Suspense> pra NÃO segurar a pintura das mensagens: a thread aparece na
 * hora (lê do banco) e o toggle entra logo atrás. `getStatusHumano` é
 * `cache()`, então este await, o dos banners e o do composer compartilham
 * UMA única chamada ao n8n por render.
 */
async function ToggleStream({ telefone }: { telefone: string }) {
  const status = await getStatusHumano(telefone);
  return <ToggleAtendimentoHumano telefone={telefone} status={status} />;
}

/** Banners de atenção/humano/confirmação — também dependem do status (n8n) e
 * da consulta de confirmações; streamados pra não bloquear as mensagens. */
async function BannersAtendimento({ telefone }: { telefone: string }) {
  const [status, confirmacoes] = await Promise.all([
    getStatusHumano(telefone),
    getConfirmacoesPendentesEmLote([telefone]),
  ]);
  const confirmacaoPendente = confirmacoes.get(telefone) ?? null;
  const detalheGrupoGrande =
    confirmacaoPendente?.tipo === "grupo_grande" ? parseDetalheGrupoGrande(confirmacaoPendente.detalhe) : null;
  // só bate no auth.admin.listUsers quando de fato vai renderizar o form de
  // confirmação de grupo grande -- na esmagadora maioria não há pendência.
  const atendentes = detalheGrupoGrande ? (await listUsuarios()).filter((u) => u.cargo !== "Desenvolvedor") : [];

  return (
    <>
      {status === "atencao" && (
        <div className="flex w-full items-center justify-center gap-2 border-b border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.08)] px-[22px] py-2">
          <AlertCircle size={14} className="text-[var(--color-status-amber)]" />
          <span className="text-[13px] font-medium text-[var(--color-status-amber)]">
            O cliente pediu para falar com um humano — clique em &quot;Assumir atendimento&quot; para responder
          </span>
        </div>
      )}
      {status === "humano" && (
        <div className="flex w-full items-center justify-center gap-2 border-b border-[rgba(216,180,254,0.2)] bg-[rgba(216,180,254,0.08)] px-[22px] py-2">
          <UserRound size={14} className="text-[#d8b4fe]" />
          <span className="text-[13px] font-medium text-[#d8b4fe]">
            Atendimento com humano — o bot está pausado nessa conversa (volta sozinho em até 1h, ou clique em &quot;Devolver ao bot&quot;)
          </span>
        </div>
      )}
      {confirmacaoPendente && (
        <div className="flex w-full flex-wrap items-center justify-center gap-2 border-b border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-[22px] py-2">
          <BellRing size={14} className="shrink-0 text-[var(--color-status-red)]" />
          <span className="text-[13px] font-medium text-[var(--color-status-red)]">
            Precisa de confirmação do gerente — {rotuloConfirmacao(confirmacaoPendente.tipo)}
            {!detalheGrupoGrande && confirmacaoPendente.detalhe ? `: ${confirmacaoPendente.detalhe}` : ""}
          </span>
          {detalheGrupoGrande ? (
            <ConfirmarGrupoGrandeForm
              id={confirmacaoPendente.id}
              telefone={telefone}
              detalhe={detalheGrupoGrande}
              atendentes={atendentes}
            />
          ) : (
            <ConfirmarPendenciaButton id={confirmacaoPendente.id} telefone={telefone} />
          )}
        </div>
      )}
    </>
  );
}

/** Composer (barra de envio). Depende do status (habilita digitação só em
 * "humano") + modelos + nome do atendente. Streamado pra não bloquear as
 * mensagens; enquanto carrega, mostra uma barra desabilitada. */
async function ComposerStream({ telefone }: { telefone: string }) {
  const [status, modelos, staff] = await Promise.all([
    getStatusHumano(telefone),
    listModelosMensagem(),
    getCurrentStaffUser(),
  ]);
  return <Composer telefone={telefone} status={status} modelos={modelos} nomeAtendente={staff?.name ?? "Equipe"} />;
}

export default async function ConversaPage({
  params,
}: PageProps<"/conversas/[telefone]">) {
  const { telefone } = await params;

  // Caminho crítico enxuto: a conversa (mensagens + cabeçalho), que lê do
  // banco. Tudo que depende do n8n (status) ou de consultas extras
  // (confirmações, modelos) foi pra <Suspense> abaixo, pra trocar de conversa
  // não esperar ~0,5-1,4s do webhook de status antes de mostrar as mensagens.
  // `marcarComoLida` (escrita best-effort) roda em paralelo -- awaitado (não
  // fire-and-forget: em serverless a promise solta pode ser morta ao retornar
  // a resposta e a leitura nunca gravaria), mas é ~200ms < getConversa, então
  // não soma tempo de parede.
  const [conversa] = await Promise.all([
    getConversa(telefone),
    marcarComoLida(telefone).catch(() => {}),
  ]);
  if (!conversa) notFound();
  const label = formatTelefoneBR(conversa.phone);

  return (
    <>
      <header className="flex w-full shrink-0 flex-col gap-2.5 border-b border-[var(--color-border)] px-4 py-2.5 lg:h-[88px] lg:flex-row lg:items-center lg:gap-3 lg:px-[22px] lg:py-0">
        <div className="flex w-full min-w-0 items-center gap-3 lg:flex-1">
          <Link
            href="/conversas"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] lg:hidden"
          >
            <ArrowLeft size={20} />
          </Link>
          <AvatarConversa phone={conversa.phone} fotoUrl={conversa.fotoUrl} size={38} className="lg:hidden" />
          <AvatarConversa phone={conversa.phone} fotoUrl={conversa.fotoUrl} size={50} className="hidden lg:flex" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate font-display text-[15px] font-semibold text-[var(--color-text-primary)] lg:text-[19px]">
              {conversa.nomeCliente || label}
            </p>
            <p className="truncate font-display text-[12px] text-[var(--color-text-muted)] lg:text-[13px]">
              {conversa.nomeCliente ? label : conversa.phone}
            </p>
          </div>
          <PerfilContatoDialog telefone={conversa.phone} />
        </div>
        <div className="w-full shrink-0 lg:w-auto">
          <Suspense fallback={null}>
            <ToggleStream telefone={telefone} />
          </Suspense>
        </div>
      </header>

      <Suspense fallback={null}>
        <BannersAtendimento telefone={telefone} />
      </Suspense>

      <ListaMensagens mensagens={conversa.mensagens} />

      <Suspense fallback={null}>
        <ComposerStream telefone={telefone} />
      </Suspense>
    </>
  );
}
