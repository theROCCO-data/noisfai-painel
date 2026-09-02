import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { getConversa } from "@/lib/data/conversas";
import { formatTelefoneBR } from "@/lib/format";
import { getStatusHumano } from "@/lib/data/status-humano";
import { ToggleAtendimentoHumano } from "@/components/conversas/toggle-atendimento-humano";
import { Composer } from "@/components/conversas/composer";
import { PerfilContatoDialog } from "@/components/conversas/perfil-contato-dialog";
import { AvatarConversa } from "@/components/conversas/avatar-conversa";
import { ListaMensagens } from "@/components/conversas/lista-mensagens";

export const dynamic = "force-dynamic";

export default async function ConversaPage({
  params,
}: PageProps<"/conversas/[conversationId]">) {
  const { conversationId } = await params;
  const conversa = await getConversa(conversationId);

  if (!conversa) notFound();

  const humano = await getStatusHumano(conversa.phone);
  const label = formatTelefoneBR(conversa.phone);

  return (
    <>
      <header className="flex w-full shrink-0 flex-col gap-2.5 border-b border-[var(--color-border)] px-4 py-2.5 lg:h-[88px] lg:flex-row lg:items-center lg:gap-3 lg:px-[22px] lg:py-0">
        <div className="flex w-full min-w-0 items-center gap-3">
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
        <div className="hidden h-px flex-1 lg:block" />
        <div className="w-full lg:w-auto [&>button]:w-full lg:[&>button]:w-auto">
          <ToggleAtendimentoHumano telefone={conversa.phone} conversationId={conversa.conversationId} humano={humano} />
        </div>
      </header>

      {humano && (
        <div className="flex w-full items-center justify-center gap-2 border-b border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.08)] px-[22px] py-2">
          <UserRound size={14} className="text-[var(--color-status-amber)]" />
          <span className="text-[13px] font-medium text-[var(--color-status-amber)]">
            Atendimento com humano — o bot está pausado nessa conversa (volta sozinho em até 1h, ou clique em &quot;Devolver ao bot&quot;)
          </span>
        </div>
      )}

      <ListaMensagens mensagens={conversa.mensagens} />

      <Composer telefone={conversa.phone} conversationId={conversa.conversationId} humano={humano} />
    </>
  );
}
