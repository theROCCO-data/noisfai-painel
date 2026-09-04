"use client";

import { useState, useTransition } from "react";
import { XCircle, X } from "lucide-react";
import { cancelarReserva } from "@/lib/data/reservas-actions";
import { toast } from "@/lib/toast";
import { useEscapeClose } from "@/hooks/use-escape-close";

export function CancelarReservaButton({ reservaId, nome }: { reservaId: number; nome: string }) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function fechar() {
    setOpen(false);
    setMotivo("");
    setError(null);
  }

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const result = await cancelarReserva(reservaId, motivo);
      if (result.ok) {
        fechar();
        toast("Reserva cancelada.");
      } else {
        setError(result.error);
      }
    });
  }

  useEscapeClose(open, fechar);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Cancelar reserva"
        aria-label="Cancelar reserva"
        className="flex size-[26px] items-center justify-center rounded-[8px] border border-white/10 text-[var(--color-text-muted)] hover:border-[var(--color-status-red)] hover:text-[var(--color-status-red)]"
      >
        <XCircle size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={fechar}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-[380px] flex-col gap-6 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-7"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[16px] font-semibold text-[var(--color-text-primary)]">Cancelar reserva</h2>
              <button onClick={fechar} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <p className="text-[13.5px] leading-[1.7] text-[var(--color-text-secondary)]">
              Tem certeza que quer cancelar a reserva de <span className="font-semibold text-[var(--color-text-primary)]">{nome}</span>?
              A vaga volta pra capacidade do dia.
            </p>

            <label className="flex flex-col gap-2.5">
              <span className="text-[12px] text-[var(--color-text-muted)]">Motivo do cancelamento (opcional)</span>
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Cliente desmarcou, imprevisto do restaurante..."
                className="dialog-input"
              />
            </label>

            {error && <p className="text-[12.5px] text-[var(--color-status-red)]">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={fechar}
                className="h-9 rounded-[999px] border border-white/[0.14] px-5 text-[13px] font-medium text-[var(--color-text-secondary)]"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={pending}
                className="h-9 rounded-[999px] bg-[var(--color-status-red)] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Cancelando..." : "Cancelar reserva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
