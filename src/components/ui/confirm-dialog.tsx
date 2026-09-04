"use client";

import { AlertTriangle } from "lucide-react";
import { useEscapeClose } from "@/hooks/use-escape-close";

/** Confirmação de ação destrutiva no estilo do painel — substitui o `confirm()` nativo do navegador. */
export function ConfirmDialog({
  open,
  titulo,
  mensagem,
  confirmarLabel = "Confirmar",
  pending,
  onConfirmar,
  onCancelar,
}: {
  open: boolean;
  titulo: string;
  mensagem: string;
  confirmarLabel?: string;
  pending?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  useEscapeClose(open, onCancelar);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60" onClick={onCancelar}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[380px] flex-col gap-5 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] text-[var(--color-status-red)]">
            <AlertTriangle size={16} />
          </span>
          <div className="flex flex-col gap-1 pt-1">
            <h2 className="font-display text-[15px] font-semibold text-[var(--color-text-primary)]">{titulo}</h2>
            <p className="text-[13px] leading-[1.6] text-[var(--color-text-secondary)]">{mensagem}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="h-9 rounded-[999px] border border-white/[0.14] px-5 text-[13px] font-medium text-[var(--color-text-secondary)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={pending}
            className="h-9 rounded-[999px] bg-[var(--color-status-red)] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Excluindo..." : confirmarLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
