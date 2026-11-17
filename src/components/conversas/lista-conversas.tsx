"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X, AlertTriangle, ChevronRight } from "lucide-react";
import { ConversaListItem } from "@/components/conversas/conversa-list-item";
import { buscarMensagens, type MensagemEncontrada } from "@/lib/data/busca-mensagens-actions";
import { formatTelefoneBR, formatHora } from "@/lib/format";
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

type Filtro = "tudo" | "nao-lidas" | "confirmacao" | "jantar-harmonizado" | "humano" | "jantar-aguardando";

// Filtros sempre à vista, em botões, como no WhatsApp (antes ficavam num menu).
const FILTROS: { id: Filtro; label: string }[] = [
  { id: "tudo", label: "Tudo" },
  { id: "nao-lidas", label: "Não lidas" },
  { id: "confirmacao", label: "Gerente" },
  { id: "jantar-harmonizado", label: "🍷 Jantar" },
  { id: "humano", label: "Humano" },
];

/** Hora se for hoje; senão a data (dd/mm), como na pesquisa do WhatsApp. */
function quandoMensagem(iso: string) {
  const dia = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  if (dia(new Date(iso)) === dia(new Date())) return formatHora(iso);
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });
}

/** Trecho da mensagem em volta do termo, com o termo destacado. */
function Trecho({ texto, termo }: { texto: string; termo: string }) {
  const limpo = texto.replace(/\s+/g, " ").trim();
  const i = limpo.toLowerCase().indexOf(termo);
  if (i < 0) return <>{limpo.slice(0, 90)}</>;
  const ini = Math.max(0, i - 30);
  return (
    <>
      {ini > 0 && "…"}
      {limpo.slice(ini, i)}
      <mark className="rounded-[3px] bg-[rgba(74,222,128,0.25)] px-[1px] text-[var(--color-text-primary)]">
        {limpo.slice(i, i + termo.length)}
      </mark>
      {limpo.slice(i + termo.length, i + termo.length + 60)}
      {i + termo.length + 60 < limpo.length && "…"}
    </>
  );
}

/**
 * Lista de conversas com pesquisa no estilo WhatsApp: o termo busca em nome e
 * telefone (seção "Conversas", filtrada aqui mesmo) e no texto do que foi
 * conversado (seção "Mensagens", busca no servidor).
 */
export function ListaConversas({ itens }: { itens: ItemConversa[] }) {
  const [filtro, setFiltro] = useState<Filtro>("tudo");
  const [busca, setBusca] = useState("");
  const [mensagens, setMensagens] = useState<MensagemEncontrada[]>([]);
  const [buscando, setBuscando] = useState(false);

  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimaBusca = useRef("");

  const termoBusca = busca.trim().toLowerCase();
  const digitosBusca = termoBusca.replace(/\D/g, "");
  const buscaNasMensagens = termoBusca.length >= 3;

  // busca no texto das mensagens, com espera curta enquanto a pessoa digita
  function mudarBusca(valor: string) {
    setBusca(valor);
    const termo = valor.trim().toLowerCase();
    if (espera.current) clearTimeout(espera.current);
    ultimaBusca.current = termo;
    if (termo.length < 3) {
      setMensagens([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    espera.current = setTimeout(async () => {
      let r: MensagemEncontrada[] = [];
      try {
        r = await buscarMensagens(termo);
      } catch {}
      // descarta resposta de uma busca que já foi substituída
      if (ultimaBusca.current !== termo) return;
      setMensagens(r);
      setBuscando(false);
    }, 350);
  }

  useEffect(() => () => {
    if (espera.current) clearTimeout(espera.current);
  }, []);

  const itensBuscados = termoBusca
    ? itens.filter(
        (i) =>
          (i.nomeCliente ?? "").toLowerCase().includes(termoBusca) ||
          (digitosBusca.length > 0 && i.phone.replace(/\D/g, "").includes(digitosBusca))
      )
    : itens;

  const qtdNaoLidas = itens.filter((i) => i.naoLida).length;
  const qtdConfirmacao = itens.filter((i) => i.confirmacaoGerenteTipo).length;
  const qtdJantar = itens.filter((i) => i.interesseJantarHarmonizado).length;
  const qtdHumano = itens.filter((i) => i.status === "humano").length;
  // o que precisa de resposta: interessado no Jantar que ainda não confirmou
  const qtdJantarAguardando = itens.filter((i) => i.interesseJantarHarmonizado && !i.jantarHarmonizadoConfirmado).length;

  const contagens: Record<Filtro, number | undefined> = {
    tudo: undefined,
    "nao-lidas": qtdNaoLidas,
    confirmacao: qtdConfirmacao,
    "jantar-harmonizado": qtdJantar,
    humano: qtdHumano,
    "jantar-aguardando": qtdJantarAguardando,
  };
  const temPendencia = qtdConfirmacao > 0 || qtdJantarAguardando > 0;

  const passaFiltro = (i: ItemConversa) =>
    filtro === "nao-lidas"
      ? i.naoLida
      : filtro === "confirmacao"
        ? !!i.confirmacaoGerenteTipo
        : filtro === "jantar-harmonizado"
          ? !!i.interesseJantarHarmonizado
          : filtro === "humano"
            ? i.status === "humano"
            : filtro === "jantar-aguardando"
              ? !!i.interesseJantarHarmonizado && !i.jantarHarmonizadoConfirmado
              : true;

  const itensFiltrados = itensBuscados.filter(passaFiltro);

  // nas mensagens encontradas, mostra o nome que a lista já conhece
  const porTelefone = new Map(itens.map((i) => [i.phone.replace(/\D/g, ""), i]));
  const mensagensFiltradas = mensagens.filter((m) => {
    const item = porTelefone.get(m.phone.replace(/\D/g, ""));
    return filtro === "tudo" || (item ? passaFiltro(item) : false);
  });

  return (
    <>
      <div className="flex h-8 w-full shrink-0 items-center gap-2 rounded-[6px] border border-[#363050] bg-[#1a1729] px-[10px] mx-[18px] mb-[12px]" style={{ width: "calc(100% - 36px)" }}>
        <Search size={14} className="shrink-0 text-[var(--color-text-muted)]" />
        <input
          value={busca}
          onChange={(e) => mudarBusca(e.target.value)}
          placeholder="Pesquisar nome, telefone ou mensagem"
          className="h-full w-full bg-transparent text-[11.5px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
        />
        {busca && (
          <button type="button" aria-label="Limpar pesquisa" onClick={() => mudarBusca("")} className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto px-[18px] pb-[12px] [scrollbar-width:none]">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-[999px] border px-[12px] py-[6px] text-[12px] font-medium whitespace-nowrap transition-colors ${
              filtro === f.id
                ? "border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.16)] text-[var(--color-text-primary)]"
                : "border-[var(--color-border-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {f.label}
            {!!contagens[f.id] && (
              <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#4ade80] px-1 text-[10px] font-bold text-[#05130a]">
                {contagens[f.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Faixa de atenção: o que espera resposta do gerente fica sempre à
          vista. Clique = filtra. */}
      {temPendencia && filtro === "tudo" && !termoBusca && (
        <div className="flex shrink-0 flex-col gap-1.5 px-[18px] pb-[12px]">
          {qtdConfirmacao > 0 && (
            <button
              type="button"
              onClick={() => setFiltro("confirmacao")}
              className="flex w-full items-center gap-2 rounded-[10px] border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.1)] px-3 py-2 text-left text-[12px] font-medium text-[#fde68a] transition-colors hover:bg-[rgba(251,191,36,0.16)]"
            >
              <AlertTriangle size={14} className="shrink-0 text-[#fbbf24]" />
              <span className="flex-1">
                <b className="font-bold text-[#fbbf24]">{qtdConfirmacao}</b> aguardando confirmação do gerente
              </span>
              <ChevronRight size={14} className="shrink-0 opacity-70" />
            </button>
          )}
          {qtdJantarAguardando > 0 && (
            <button
              type="button"
              onClick={() => setFiltro("jantar-aguardando")}
              className="flex w-full items-center gap-2 rounded-[10px] border border-[rgba(168,85,247,0.35)] bg-[rgba(168,85,247,0.1)] px-3 py-2 text-left text-[12px] font-medium text-[#e9d5ff] transition-colors hover:bg-[rgba(168,85,247,0.16)]"
            >
              <span className="shrink-0">🍷</span>
              <span className="flex-1">
                <b className="font-bold text-[#d8b4fe]">{qtdJantarAguardando}</b> interessados no Jantar sem confirmação
              </span>
              <ChevronRight size={14} className="shrink-0 opacity-70" />
            </button>
          )}
        </div>
      )}

      {filtro === "jantar-aguardando" && (
        <div className="flex shrink-0 items-center justify-between px-[18px] pb-[10px] text-[11.5px] text-[var(--color-text-muted)]">
          <span>🍷 Interessados no Jantar sem confirmação</span>
          <button type="button" onClick={() => setFiltro("tudo")} className="text-[var(--color-text-primary)] underline-offset-2 hover:underline">
            Ver tudo
          </button>
        </div>
      )}

      {termoBusca && (
        <p className="px-[18px] pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[#4ade80]">Conversas</p>
      )}

      {itensFiltrados.length === 0 ? (
        <p className="px-[18px] py-4 text-[13px] text-[var(--color-text-muted)]">
          {termoBusca ? "Nenhuma conversa com esse nome ou telefone." : filtro === "tudo" ? "Nenhuma conversa registrada ainda." : "Nada por aqui."}
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

      {buscaNasMensagens && (
        <>
          <p className="px-[18px] pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[#4ade80]">Mensagens</p>
          {buscando && mensagensFiltradas.length === 0 ? (
            <p className="px-[18px] py-4 text-[13px] text-[var(--color-text-muted)]">Procurando nas conversas…</p>
          ) : mensagensFiltradas.length === 0 ? (
            <p className="px-[18px] py-4 text-[13px] text-[var(--color-text-muted)]">Nenhuma mensagem com esse termo.</p>
          ) : (
            mensagensFiltradas.map((m, idx) => {
              const item = porTelefone.get(m.phone.replace(/\D/g, ""));
              const nome = item?.nomeCliente || formatTelefoneBR(m.phone);
              return (
                <Link
                  key={`${m.phone}-${m.criadaEm}-${idx}`}
                  href={`/conversas/${item?.phone ?? m.phone}`}
                  prefetch={false}
                  className="flex w-full flex-col gap-1 rounded-[18px] px-[18px] py-2.5 hover:bg-white/[0.03]"
                >
                  <div className="flex w-full items-start">
                    <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{nome}</p>
                    <div className="h-px min-w-px flex-1" />
                    <span className="font-display text-[11.5px] text-[var(--color-text-muted)]">{quandoMensagem(m.criadaEm)}</span>
                  </div>
                  <p className="line-clamp-2 text-[11.5px] text-[var(--color-text-muted)]">
                    {m.deNos && <span className="text-[var(--color-text-secondary)]">Você: </span>}
                    <Trecho texto={m.texto} termo={termoBusca} />
                  </p>
                </Link>
              );
            })
          )}
        </>
      )}
    </>
  );
}
