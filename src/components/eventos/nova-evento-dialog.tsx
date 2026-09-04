"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { criarEventoManual } from "@/lib/data/eventos-actions";
import { toast } from "@/lib/toast";
import { MaskedCpfInput } from "@/components/ui/masked-cpf-input";
import { MaskedPhoneInput } from "@/components/ui/masked-phone-input";
import { MaskedTimeInput } from "@/components/ui/masked-time-input";
import { DatePicker } from "@/components/ui/date-picker";
import { useEscapeClose } from "@/hooks/use-escape-close";

export function NovaEventoDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await criarEventoManual({
        nome: String(formData.get("nome") ?? ""),
        telefone: String(formData.get("telefone") ?? ""),
        cpf: String(formData.get("cpf") ?? ""),
        email: String(formData.get("email") ?? ""),
        nomeEvento: String(formData.get("nomeEvento") ?? ""),
        tipo: String(formData.get("tipo") ?? ""),
        data: String(formData.get("data") ?? ""),
        horario: String(formData.get("horario") ?? ""),
        pessoas: Number(formData.get("pessoas") ?? 10),
        valor: String(formData.get("valor") ?? ""),
        observacao: String(formData.get("observacao") ?? ""),
      });
      if (result.ok) {
        setOpen(false);
        toast("Evento cadastrado.");
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
        <span className="text-[13px] font-semibold text-white">Novo evento</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-[460px] flex-col gap-4 overflow-y-auto rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">Novo evento</h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>
            <p className="-mt-2 text-[11.5px] leading-[1.5] text-[var(--color-text-muted)]">
              Espaço de eventos: 2º andar, capacidade para 80 pessoas. Se o telefone já for de um cliente cadastrado, o
              evento fica vinculado ao cadastro existente.
            </p>

            <form action={handleSubmit} className="flex flex-col gap-3">
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

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">E-mail (opcional)</span>
                <input name="email" type="email" placeholder="cliente@email.com" className="dialog-input" />
              </label>

              <div className="mt-1 border-t border-white/[0.07] pt-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Nome do evento</span>
                  <input name="nomeEvento" placeholder="Ex: Aniversário de 40 anos" required className="dialog-input" />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Tipo (opcional)</span>
                <input name="tipo" placeholder="Ex: Aniversário, casamento, corporativo..." className="dialog-input" />
              </label>

              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Data</span>
                  <DatePicker name="data" required />
                </label>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Horário (opcional)</span>
                  <MaskedTimeInput name="horario" />
                </label>
              </div>

              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Número de pessoas</span>
                  <input name="pessoas" type="number" min={10} max={80} defaultValue={10} required className="dialog-input" />
                </label>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Valor da reserva (opcional)</span>
                  <input name="valor" type="number" step="0.01" min={0} placeholder="R$" className="dialog-input" />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Observação (opcional)</span>
                <input name="observacao" placeholder="Detalhes do evento, pedidos especiais..." className="dialog-input" />
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
                  {pending ? "Salvando..." : "Cadastrar evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
