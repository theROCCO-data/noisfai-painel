"use client";

import { useState } from "react";
import { useTransition } from "react";
import { X } from "lucide-react";
import { criarFatoRestaurante, editarFatoRestaurante } from "@/lib/data/perfil-restaurante-actions";
import { toast } from "@/lib/toast";
import { CategoriaField } from "@/components/ui/categoria-field";
import { useEscapeClose } from "@/hooks/use-escape-close";
import type { FatoRestaurante } from "@/lib/data/perfil-restaurante";

export function FatoDialog({
  fato,
  trigger,
  categorias,
}: {
  fato?: FatoRestaurante;
  trigger: React.ReactNode;
  categorias: string[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = fato ? await editarFatoRestaurante(fato.id, formData) : await criarFatoRestaurante(formData);
      if (result.ok) {
        setOpen(false);
        toast(fato ? "Informação atualizada." : "Informação adicionada.");
      } else {
        setError(result.error);
      }
    });
  }

  useEscapeClose(open, () => setOpen(false));

  return (
    <>
      <button onClick={() => setOpen(true)}>{trigger}</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-[460px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
                {fato ? "Editar informação" : "Nova informação"}
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-3">
              <CategoriaField categorias={categorias} defaultValue={fato?.categoria} />

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Tópico</span>
                <input
                  name="topico"
                  defaultValue={fato?.topico}
                  placeholder="Ex: Horário de funcionamento"
                  required
                  className="dialog-input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Informação</span>
                <textarea
                  name="informacao"
                  defaultValue={fato?.informacao}
                  placeholder="O texto exato que deve valer como referência"
                  required
                  className="dialog-input h-auto min-h-[140px] overflow-y-auto py-2.5 leading-[1.6]"
                />
              </label>

              {error && <p className="text-[12.5px] text-[var(--color-status-red)]">{error}</p>}

              <div className="mt-2 flex justify-end gap-3">
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
                  {pending ? "Salvando..." : fato ? "Salvar" : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
