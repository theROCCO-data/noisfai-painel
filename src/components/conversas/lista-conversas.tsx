"use client";

import { useState } from "react";
import { ConversaListItem } from "@/components/conversas/conversa-list-item";
import type { ConversaResumo } from "@/lib/data/conversas";
import type { StatusAtendimento } from "@/lib/data/status-humano";
import type { TipoConfirmacaoGerente } from "@/lib/confirmacoes-gerente-shared";

export type ItemConversa = ConversaResumo & {
  status: StatusAtendimento;
  contagemNaoLidas?: number;
  confirmacaoGerenteTipo?: TipoConfirmacaoGerente | null;
};

type Filtro = "tudo" | "nao-lidas" | "confirmacao";

/**
 * Abas ao estilo WhatsApp (Tudo / Não lidas / Confirmação do Gerente) —
 * filtro só de exibição, client-side, sobre a lista já carregada (o
 * servidor já manda tudo, filtrar aqui evita reload de rota/searchParams
 * num layout, que não recebe searchParams no App Router).
 */
export function ListaConversas({ itens }: { itens: ItemConversa[] }) {
  const [filtro, setFiltro] = useState<Filtro>("tudo");

  const qtdNaoLidas = itens.filter((i) => i.naoLida).length;
  const qtdConfirmacao = itens.filter((i) => i.confirmacaoGerenteTipo).length;

  const itensFiltrados =
    filtro === "nao-lidas"
      ? itens.filter((i) => i.naoLida)
      : filtro === "confirmacao"
        ? itens.filter((i) => i.confirmacaoGerenteTipo)
        : itens;

  return (
    <>
      <div className="flex w-full items-center gap-1.5 overflow-x-auto px-[18px] pb-[12px]">
        <AbaFiltro label="Tudo" ativo={filtro === "tudo"} onClick={() => setFiltro("tudo")} />
        <AbaFiltro
          label="Não lidas"
          contagem={qtdNaoLidas}
          ativo={filtro === "nao-lidas"}
          onClick={() => setFiltro("nao-lidas")}
        />
        <AbaFiltro
          label="Confirmação do Gerente"
          contagem={qtdConfirmacao}
          ativo={filtro === "confirmacao"}
          onClick={() => setFiltro("confirmacao")}
        />
      </div>

      {itensFiltrados.length === 0 ? (
        <p className="px-[18px] py-6 text-[13px] text-[var(--color-text-muted)]">
          {filtro === "tudo" ? "Nenhuma conversa registrada ainda." : "Nada por aqui."}
        </p>
      ) : (
        itensFiltrados.map((c) => (
          <ConversaListItem
            key={c.phone}
            phone={c.phone}
            ultimaAtualizacao={c.ultimaAtualizacao}
            ultimaMensagem={c.ultimaMensagem}
            status={c.status}
            fotoUrl={c.fotoUrl}
            nomeCliente={c.nomeCliente}
            naoLida={c.naoLida}
            contagemNaoLidas={c.contagemNaoLidas}
            confirmacaoGerenteTipo={c.confirmacaoGerenteTipo}
          />
        ))
      )}
    </>
  );
}

function AbaFiltro({
  label,
  contagem,
  ativo,
  onClick,
}: {
  label: string;
  contagem?: number;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-[999px] border px-[12px] py-[6px] text-[12px] font-medium whitespace-nowrap transition-colors ${
        ativo
          ? "border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.16)] text-[var(--color-text-primary)]"
          : "border-[var(--color-border-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      }`}
    >
      {label}
      {!!contagem && (
        <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#4ade80] px-1 text-[10px] font-bold text-[#05130a]">
          {contagem}
        </span>
      )}
    </button>
  );
}
