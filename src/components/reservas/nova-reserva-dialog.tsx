"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { criarReservaManual } from "@/lib/data/reservas-actions";
import { DatePicker } from "@/components/ui/date-picker";
import { MaskedTimeInput } from "@/components/ui/masked-time-input";
import { CustomSelect } from "@/components/ui/custom-select";

export function NovaReservaDialog({ atendentes }: { atendentes: { id: string; nome: string }[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    const responsavel = String(formData.get("responsavel") ?? "");
    if (!responsavel) {
      setError("Selecione o responsável pela reserva.");
      return;
    }
    startTransition(async () => {
      const result = await criarReservaManual({
        nome: String(formData.get("nome") ?? ""),
        telefone: String(formData.get("telefone") ?? ""),
        cpf: String(formData.get("cpf") ?? ""),
        email: String(formData.get("email") ?? ""),
        data: String(formData.get("data") ?? ""),
        horario: String(formData.get("horario") ?? ""),
        turno: formData.get("turno") === "jantar" ? "jantar" : "almoco",
        pessoas: Number(formData.get("pessoas") ?? 1),
        objetivo: String(formData.get("objetivo") ?? ""),
        canal: formData.get("canal") === "online" ? "online" : "presencial",
        observacao: String(formData.get("observacao") ?? ""),
        responsavelUserId: responsavel === "chatbot" ? null : responsavel,
      });
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-[34px] shrink-0 items-center gap-2 rounded-[999px] px-5 shadow-[0px_14px_32px_-14px_rgba(168,85,247,0.5)]"
        style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
      >
        <Plus size={15} className="text-white" />
        <span className="text-[13px] font-semibold text-white">Nova reserva</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className="flex w-[460px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
                Nova reserva
              </h2>
              <button onClick={() => setOpen(false)} className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-3">
              <Field label="Nome do cliente">
                <input name="nome" required className="dialog-input" />
              </Field>
              <div className="flex gap-3">
                <Field label="Telefone" className="flex-1">
                  <input name="telefone" required placeholder="55219..." className="dialog-input" />
                </Field>
                <Field label="CPF" className="flex-1">
                  <input name="cpf" placeholder="000.000.000-00" className="dialog-input" />
                </Field>
              </div>
              <Field label="E-mail (opcional)">
                <input name="email" type="email" placeholder="cliente@email.com" className="dialog-input" />
              </Field>
              <div className="flex gap-3">
                <Field label="Data" className="flex-1">
                  <DatePicker name="data" required />
                </Field>
                <Field label="Horário" className="flex-1">
                  <MaskedTimeInput name="horario" required />
                </Field>
              </div>
              <div className="flex gap-3">
                <Field label="Turno" className="flex-1">
                  <CustomSelect
                    name="turno"
                    defaultValue="almoco"
                    options={[
                      { value: "almoco", label: "Almoço" },
                      { value: "jantar", label: "Jantar" },
                    ]}
                  />
                </Field>
                <Field label="Pessoas" className="flex-1">
                  <input name="pessoas" type="number" min={1} defaultValue={2} required className="dialog-input" />
                </Field>
              </div>
              <Field label="Origem da reserva">
                <CustomSelect
                  name="canal"
                  defaultValue="presencial"
                  options={[
                    { value: "presencial", label: "Presencial (balcão/telefone)" },
                    { value: "online", label: "Online (WhatsApp/bot)" },
                  ]}
                />
              </Field>
              <Field label="Responsável pela reserva">
                <CustomSelect
                  name="responsavel"
                  placeholder="Quem está fazendo essa reserva?"
                  options={[
                    { value: "chatbot", label: "Chatbot IA" },
                    ...atendentes.map((a) => ({ value: a.id, label: a.nome })),
                  ]}
                />
              </Field>
              <Field label="Ocasião (opcional)">
                <input name="objetivo" placeholder="Aniversário, jantar de negócios..." className="dialog-input" />
              </Field>
              <Field label="Observação (opcional)">
                <textarea
                  name="observacao"
                  placeholder="Alergias, preferências, pedidos especiais..."
                  rows={3}
                  className="dialog-input h-auto resize-y py-2"
                />
              </Field>

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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-[12px] text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}
