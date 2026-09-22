"use client";

import { useState } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { ConversaListItem } from "@/components/conversas/conversa-list-item";
import type { ConversaResumo } from "@/lib/data/conversas";
import type { StatusAtendimento } from "@/lib/data/status-humano";
import type { TipoConfirmacaoGerente } from "@/lib/confirmacoes-gerente-shared";

export type ItemConversa = ConversaResumo & {
  status: StatusAtendimento;
  contagemNaoLidas?: number;
  confirmacaoGerenteTipo?: TipoConfirmacaoGerente | null;
  interesseJantarHarmonizado?: boolean;
  jantarHarmonizadoConfirmado?: boolean;
};

type Filtro = "tudo" | "nao-lidas" | "confirmacao" | "jantar-harmonizado";

const FILTROS_META: { id: Filtro; label: string }[] = [
  { id: "tudo", label: "Tudo" },
  { id: "nao-lidas", label: "Não lidas" },
  { id: "confirmacao", label: "Confirmação do Gerente" },
  { id: "jantar-harmonizado", label: "🍷 Jantar Harmonizado" },
];

/**
 * Abas ao estilo WhatsApp (Tudo / Não lidas / Confirmação do Gerente) —
 * filtro só de exibição, client-side, sobre a lista já carregada (o
 * servidor já manda tudo, filtrar aqui evita reload de rota/searchParams
 * num layout, que não recebe searchParams no App Router).
 */
export function ListaConversas({ itens }: { itens: ItemConversa[] }) {
  const [filtro, setFiltro] = useState<Filtro>("tudo");
  const [busca, setBusca] = useState("");
  const [menuFiltroAberto, setMenuFiltroAberto] = useState(false);

  const termoBusca = busca.trim().toLowerCase();
  const digitosBusca = termoBusca.replace(/\D/g, "");
  const itensBuscados = termoBusca
    ? itens.filter(
        (i) =>
          (i.nomeCliente ?? "").toLowerCase().includes(termoBusca) ||
          (digitosBusca.length > 0 && i.phone.replace(/\D/g, "").includes(digitosBusca))
      )
    : itens;

  const qtdNaoLidas = itensBuscados.filter((i) => i.naoLida).length;
  const qtdConfirmacao = itensBuscados.filter((i) => i.confirmacaoGerenteTipo).length;
  const qtdJantar = itensBuscados.filter((i) => i.interesseJantarHarmonizado).length;

  const contagens: Record<Filtro, number | undefined> = {
    tudo: undefined,
    "nao-lidas": qtdNaoLidas,
    confirmacao: qtdConfirmacao,
    "jantar-harmonizado": qtdJantar,
  };
  const filtroAtivo = FILTROS_META.find((f) => f.id === filtro)!;

  const itensFiltrados =
    filtro === "nao-lidas"
      ? itensBuscados.filter((i) => i.naoLida)
      : filtro === "confirmacao"
        ? itensBuscados.filter((i) => i.confirmacaoGerenteTipo)
        : filtro === "jantar-harmonizado"
          ? itensBuscados.filter((i) => i.interesseJantarHarmonizado)
          : itensBuscados;

  return (
    <>
      <div className="flex h-8 w-full shrink-0 items-center gap-2 rounded-[6px] border border-[#363050] bg-[#1a1729] px-[10px] mx-[18px] mb-[12px]" style={{ width: "calc(100% - 36px)" }}>
        <Search size={14} className="shrink-0 text-[var(--color-text-muted)]" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone"
          className="h-full w-full bg-transparent text-[11.5px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
        />
      </div>

      <div className="relative shrink-0 px-[18px] pb-[12px]">
        <button
          type="button"
          onClick={() => setMenuFiltroAberto((o) => !o)}
          className={`flex items-center gap-1.5 rounded-[999px] border px-[12px] py-[6px] text-[12px] font-medium whitespace-nowrap transition-colors ${
            filtro !== "tudo"
              ? "border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.16)] text-[var(--color-text-primary)]"
              : "border-[var(--color-border-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {filtroAtivo.label}
          {!!contagens[filtro] && (
            <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#4ade80] px-1 text-[10px] font-bold text-[#05130a]">
              {contagens[filtro]}
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform ${menuFiltroAberto ? "rotate-180" : ""}`} />
        </button>

        {menuFiltroAberto && (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setMenuFiltroAberto(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div className="absolute left-[18px] z-20 mt-1.5 w-[240px] overflow-hidden rounded-xl border border-[#363050] bg-[#1a1729] p-1 shadow-[var(--shadow-card,0_10px_30px_-10px_rgba(0,0,0,0.6))]">
              {FILTROS_META.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFiltro(f.id);
                    setMenuFiltroAberto(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[12px] transition-colors ${
                    filtro === f.id
                      ? "bg-[rgba(168,85,247,0.16)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-muted)] hover:bg-white/[0.04] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Check size={13} className={filtro === f.id ? "opacity-100" : "opacity-0"} />
                    {f.label}
                  </span>
                  {!!contagens[f.id] && (
                    <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#4ade80] px-1 text-[10px] font-bold text-[#05130a]">
                      {contagens[f.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
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
            interesseJantarHarmonizado={c.interesseJantarHarmonizado}
            jantarHarmonizadoConfirmado={c.jantarHarmonizadoConfirmado}
          />
        ))
      )}
    </>
  );
}

