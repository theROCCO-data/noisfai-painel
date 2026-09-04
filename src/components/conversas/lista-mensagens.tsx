"use client";

import { useEffect, useRef } from "react";
import { formatHora, formatSeparadorData, diaChave } from "@/lib/format";
import { MensagemTexto } from "@/components/conversas/mensagem-texto";
import type { Mensagem } from "@/lib/data/conversas";

export function ListaMensagens({ mensagens }: { mensagens: Mensagem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const grudadoNoFim = useRef(true);

  function irParaOFim(behavior: ScrollBehavior = "auto") {
    const el = containerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }

  // no primeiro carregamento da conversa, sempre abre na última mensagem —
  // sem isso o F5/troca de conversa jogava a tela pro topo (a mais antiga)
  useEffect(() => {
    irParaOFim();
  }, []);

  // a cada mensagem nova (inclusive as que chegam pelo auto-refresh de 4s),
  // só rola pro fim sozinho se o usuário já estava lá — se ele subiu pra ler
  // o histórico, o refresh não deve puxar ele de volta pra baixo.
  useEffect(() => {
    if (grudadoNoFim.current) irParaOFim("smooth");
  }, [mensagens.length]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    grudadoNoFim.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex w-full flex-1 flex-col gap-3 overflow-y-auto p-[22px]"
    >
      {mensagens.length === 0 ? (
        <p className="text-[13px] text-[var(--color-text-muted)]">Sem mensagens registradas nessa conversa.</p>
      ) : (
        mensagens.map((m, i) => (
          <div key={m.id} className="flex w-full flex-col gap-3">
            {(i === 0 || diaChave(m.createdAt) !== diaChave(mensagens[i - 1].createdAt)) && (
              <div className="my-1 flex w-full items-center justify-center">
                <span className="rounded-[999px] border border-[var(--color-border-soft)] bg-white/[0.05] px-3 py-1 text-[11px] font-medium text-[var(--color-text-muted)]">
                  {formatSeparadorData(m.createdAt)}
                </span>
              </div>
            )}
            {m.userMessage && (
              <div className="flex w-fit max-w-[560px] flex-col gap-1 rounded-tl-[20px] rounded-tr-[20px] rounded-br-[20px] rounded-bl-[7px] border border-[var(--color-border-soft)] bg-white/[0.04] px-[18px] py-[14px]">
                <MensagemTexto texto={m.userMessage} />
                <span className="self-end text-[10.5px] text-[var(--color-text-muted)]">{formatHora(m.createdAt)}</span>
              </div>
            )}
            {m.botMessage && (
              <div
                className="ml-auto flex w-fit max-w-[560px] flex-col gap-1 rounded-tl-[20px] rounded-tr-[20px] rounded-bl-[20px] rounded-br-[7px] border border-[rgba(168,85,247,0.3)] px-[18px] py-[14px]"
                style={{ backgroundImage: "linear-gradient(172deg, rgba(168,85,247,0.24) 14%, rgba(124,58,237,0.14) 86%)" }}
              >
                <MensagemTexto texto={m.botMessage} />
                <span className="self-end text-[10.5px] text-[var(--color-text-muted)]">{formatHora(m.createdAt)}</span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
