"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { criarReservaManualJH } from "@/lib/data/jantar-harmonizado-actions";
import { toast } from "@/lib/toast";
import type { EdicaoJH } from "@/lib/data/jantar-harmonizado";
import { CustomSelect } from "@/components/ui/custom-select";
import { MaskedCpfInput } from "@/components/ui/masked-cpf-input";
import { MaskedPhoneInput } from "@/components/ui/masked-phone-input";
import { useEscapeClose } from "@/hooks/use-escape-close";

export function NovaReservaJHDialog({ edicao }: { edicao: EdicaoJH | null }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<"confirmado" | "pendente">("confirmado");

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await criarReservaManualJH(formData);
      if (result.ok) {
        setOpen(false);
        toast("Reserva criada.");
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
        disabled={!edicao}
        title={edicao ? "Nova reserva manual do Jantar Harmonizado" : "Cadastre uma edição ativa primeiro"}
        className="flex h-[30px] shrink-0 items-center gap-1.5 rounded-[999px] px-4 shadow-[0px_10px_22px_-12px_rgba(168,85,247,0.6)] disabled:opacity-40"
        style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
      >
        <Plus size={13} className="text-white" />
        <span className="text-[12.5px] font-semibold text-white">Nova reserva</span>
      </button>

      {open && edicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-[460px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
                Nova reserva — Jantar Harmonizado
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-3">
              <input type="hidden" name="data" value={edicao.dataEvento} />

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Nome do cliente</span>
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
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">E-mail (opcional)</span>
                  <input name="email" type="email" className="dialog-input" />
                </label>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Pessoas</span>
                  <input name="pessoas" type="number" min={1} defaultValue={2} required className="dialog-input" />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Situação</span>
                <CustomSelect
                  name="statusPagamento"
                  defaultValue={tipo}
                  onChange={(v) => setTipo(v as "confirmado" | "pendente")}
                  options={[
                    { value: "confirmado", label: "Reserva confirmada (pagamento já recebido)" },
                    { value: "pendente", label: "Pré-reserva (aguardando pagamento)" },
                  ]}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">
                  Comprovante de pagamento {tipo === "pendente" ? "(opcional)" : ""}
                </span>
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
                  {pending ? "Salvando..." : "Criar reserva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
