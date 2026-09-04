"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { atualizarInfoEspacoEventos } from "@/lib/data/configuracoes-actions";
import { toast } from "@/lib/toast";
import { useEscapeClose } from "@/hooks/use-escape-close";

export function EditarInfoEspacoDialog({ infoAtual }: { infoAtual: string | null }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await atualizarInfoEspacoEventos(formData);
      if (result.ok) {
        setOpen(false);
        toast("Informação do espaço atualizada.");
      } else {
        setError(result.error);
      }
    });
  }

  useEscapeClose(open, () => setOpen(false));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Editar informações do espaço"
        aria-label="Editar informações do espaço"
        className="flex size-[26px] shrink-0 items-center justify-center rounded-[8px] text-[var(--color-text-muted)] hover:bg-white/[0.06] hover:text-[var(--color-text-secondary)]"
      >
        <Pencil size={13} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-[440px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">Sobre o espaço de eventos</h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-3">
              <textarea
                name="espacoEventosInfo"
                defaultValue={infoAtual ?? ""}
                placeholder="Ex: O segundo andar é um ambiente privativo reservável para eventos, com capacidade para 80 pessoas..."
                className="dialog-input h-auto min-h-[140px] resize-none py-2.5 leading-[1.6]"
              />

              {error && <p className="text-[12.5px] text-[var(--color-status-red)]">{error}</p>}

              <div className="mt-1 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-9 rounded-[999px] border border-white/[0.14] px-5 text-[13px] font-medium text-[var(--color-text-secondary)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="h-9 rounded-[999px] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
                  style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
                >
                  {pending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
