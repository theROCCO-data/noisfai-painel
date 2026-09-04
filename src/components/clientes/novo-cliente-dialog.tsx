"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { criarClienteManual } from "@/lib/data/clientes-actions";
import { toast } from "@/lib/toast";
import { MaskedCpfInput } from "@/components/ui/masked-cpf-input";
import { MaskedPhoneInput } from "@/components/ui/masked-phone-input";
import { useEscapeClose } from "@/hooks/use-escape-close";

export function NovoClienteDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await criarClienteManual({
        nome: String(formData.get("nome") ?? ""),
        telefone: String(formData.get("telefone") ?? ""),
        cpf: String(formData.get("cpf") ?? ""),
        email: String(formData.get("email") ?? ""),
      });
      if (result.ok) {
        setOpen(false);
        toast("Cliente criado.");
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
        className="flex h-[34px] shrink-0 items-center gap-2 rounded-[999px] px-5 shadow-[0px_14px_32px_-14px_rgba(168,85,247,0.5)]"
        style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
      >
        <Plus size={15} className="text-white" />
        <span className="text-[13px] font-semibold text-white">Novo cliente</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-[460px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">Novo cliente</h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Nome</span>
                <input name="nome" required className="dialog-input" />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Telefone</span>
                  <MaskedPhoneInput name="telefone" required />
                </label>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">CPF (opcional)</span>
                  <MaskedCpfInput name="cpf" />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">E-mail (opcional)</span>
                <input name="email" type="email" placeholder="cliente@email.com" className="dialog-input" />
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
                  {pending ? "Salvando..." : "Criar cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
