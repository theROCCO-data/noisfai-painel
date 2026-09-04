"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { atualizarPerfilRestaurante } from "@/lib/data/configuracoes-actions";
import { toast } from "@/lib/toast";
import { useEscapeClose } from "@/hooks/use-escape-close";
import type { PerfilRestauranteBasico } from "@/lib/data/configuracoes";

export function EditarPerfilDialog({ perfil }: { perfil: PerfilRestauranteBasico }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await atualizarPerfilRestaurante(formData);
      if (result.ok) {
        setOpen(false);
        toast("Perfil do restaurante atualizado.");
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
        className="flex h-9 items-center gap-2 rounded-[999px] border border-[var(--color-border-soft)] px-4 text-[13px] font-medium text-[var(--color-text-secondary)] hover:border-[rgba(168,85,247,0.4)] hover:text-[var(--color-accent)]"
      >
        <Pencil size={13} />
        Editar perfil
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-[500px] flex-col gap-4 overflow-y-auto rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">Editar perfil do restaurante</h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Nome do restaurante</span>
                <input name="nome" defaultValue={perfil.nome ?? ""} required className="dialog-input" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Sobre o restaurante</span>
                <textarea
                  name="sobre"
                  defaultValue={perfil.sobre ?? ""}
                  placeholder="Uma descrição curta do restaurante"
                  className="dialog-input h-auto min-h-[90px] resize-none py-2.5 leading-[1.5]"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Endereço</span>
                <input name="endereco" defaultValue={perfil.endereco ?? ""} className="dialog-input" />
              </label>

              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Telefone</span>
                  <input name="telefone" defaultValue={perfil.telefone ?? ""} className="dialog-input" />
                </label>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Horário de funcionamento</span>
                  <input name="horarioFuncionamento" defaultValue={perfil.horarioFuncionamento ?? ""} className="dialog-input" />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Site (opcional)</span>
                <input name="siteUrl" type="url" defaultValue={perfil.siteUrl ?? ""} placeholder="https://..." className="dialog-input" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Link do iFood</span>
                <input name="ifoodUrl" type="url" defaultValue={perfil.ifoodUrl ?? ""} placeholder="https://..." className="dialog-input" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Link do cardápio digital</span>
                <input
                  name="cardapioDigitalUrl"
                  type="url"
                  defaultValue={perfil.cardapioDigitalUrl ?? ""}
                  placeholder="https://..."
                  className="dialog-input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Outras unidades NOI (opcional)</span>
                <textarea
                  name="outrasUnidades"
                  defaultValue={perfil.outrasUnidades ?? ""}
                  placeholder="Telefones de outras unidades, se o cliente perguntar"
                  className="dialog-input h-auto min-h-[70px] resize-none py-2.5 leading-[1.5]"
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
