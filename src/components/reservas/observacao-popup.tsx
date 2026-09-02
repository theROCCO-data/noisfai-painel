"use client";

import { useState } from "react";
import { MessageSquareText, X } from "lucide-react";

export function ObservacaoPopup({ observacao, nome }: { observacao: string | null; nome: string }) {
  const [open, setOpen] = useState(false);

  if (!observacao) {
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
              <button onClick={() => setOpen(false)} className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>
            <div className="flex items-start gap-2.5 rounded-[14px] border border-white/[0.08] bg-white/[0.04] p-4">
              <MessageSquareText size={15} className="mt-0.5 shrink-0 text-[var(--color-text-muted)]" />
              <p className="whitespace-pre-wrap text-[13.5px] leading-[1.5] text-[var(--color-text-primary)]">
                {observacao}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
