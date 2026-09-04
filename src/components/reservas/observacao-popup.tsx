"use client";

import { useState } from "react";
import { MessageSquareText, X, Ban } from "lucide-react";
import { useEscapeClose } from "@/hooks/use-escape-close";

export function ObservacaoPopup({
  observacao,
  motivoCancelamento,
  nome,
}: {
  observacao: string | null;
  motivoCancelamento?: string | null;
  nome: string;
}) {
  const [open, setOpen] = useState(false);
  const temAlgo = !!observacao || !!motivoCancelamento;

  useEscapeClose(open && temAlgo, () => setOpen(false));

  if (!temAlgo) {
    return (
      <span title="Sem observação" className="flex shrink-0 items-center text-[var(--color-text-muted)]">
        <MessageSquareText size={15} />
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Ver observação"
        aria-label="Ver observação"
        className="flex shrink-0 items-center text-[var(--color-status-amber)] hover:text-[var(--color-status-amber)]/80"
      >
        <MessageSquareText size={15} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-[360px] flex-col gap-3 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[15px] font-semibold text-[var(--color-text-primary)]">
                Observação — {nome}
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            {observacao && (
              <div className="flex items-start gap-2.5 rounded-[14px] border border-white/[0.08] bg-white/[0.04] p-4">
                <MessageSquareText size={15} className="mt-0.5 shrink-0 text-[var(--color-text-muted)]" />
                <p className="whitespace-pre-wrap text-[13.5px] leading-[1.5] text-[var(--color-text-primary)]">
                  {observacao}
                </p>
              </div>
            )}

            {motivoCancelamento && (
              <div className="flex flex-col gap-1.5 rounded-[14px] border border-[rgba(248,113,113,0.22)] bg-[rgba(248,113,113,0.07)] p-4">
                <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--color-status-red)]">
                  <Ban size={13} />
                  Motivo do cancelamento
                </div>
                <p className="whitespace-pre-wrap text-[13.5px] leading-[1.5] text-[var(--color-text-primary)]">
                  {motivoCancelamento}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
