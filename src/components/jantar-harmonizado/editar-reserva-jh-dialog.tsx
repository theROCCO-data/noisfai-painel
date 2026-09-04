"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { editarReservaManualJH } from "@/lib/data/jantar-harmonizado-actions";
import { toast } from "@/lib/toast";
import { CustomSelect } from "@/components/ui/custom-select";
import { MaskedCpfInput } from "@/components/ui/masked-cpf-input";
import { MaskedPhoneInput } from "@/components/ui/masked-phone-input";
import { useEscapeClose } from "@/hooks/use-escape-close";
import type { PreReservaJH } from "@/lib/data/jantar-harmonizado";

export function EditarReservaJHDialog({ reserva }: { reserva: PreReservaJH }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await editarReservaManualJH(reserva.id, formData);
      if (result.ok) {
        setOpen(false);
        toast("Reserva atualizada.");
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
        title="Editar reserva"
        aria-label="Editar reserva"
        className="flex size-[26px] items-center justify-center rounded-[8px] text-[var(--color-text-muted)] hover:bg-white/[0.06] hover:text-[var(--color-text-secondary)]"
      >
        <Pencil size={13} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-[460px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
                Editar reserva — Jantar Harmonizado
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Nome do cliente</span>
                <input name="nome" defaultValue={reserva.nome} required className="dialog-input" />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Telefone</span>
                  <MaskedPhoneInput name="telefone" defaultValue={reserva.telefone} required />
                </label>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">CPF (opcional)</span>
                  <MaskedCpfInput name="cpf" defaultValue={reserva.cpf ?? ""} />
                </label>
              </div>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">E-mail (opcional)</span>
                  <input name="email" type="email" defaultValue={reserva.email ?? ""} className="dialog-input" />
                </label>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Pessoas</span>
                  <input name="pessoas" type="number" min={1} defaultValue={reserva.pessoas} required className="dialog-input" />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Situação</span>
                <CustomSelect
                  name="statusPagamento"
                  defaultValue={reserva.statusPagamento === "confirmado" ? "confirmado" : "pendente"}
                  options={[
                    { value: "confirmado", label: "Reserva confirmada (pagamento já recebido)" },
                    { value: "pendente", label: "Pré-reserva (aguardando pagamento)" },
                  ]}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">
                  {reserva.comprovanteUrl ? "Trocar comprovante (opcional)" : "Comprovante de pagamento (opcional)"}
                </span>
                {reserva.comprovanteUrl && (
                  <a
                    href={reserva.comprovanteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12.5px] font-medium text-[#d8b4fe] hover:underline"
                  >
                    Ver comprovante atual
                  </a>
                )}
                <input name="comprovante" type="file" accept="image/*,application/pdf" className="dialog-input" />
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
                  {pending ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
