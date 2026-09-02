"use client";

import { useState, useTransition } from "react";
import { X, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { MaskedTimeInput } from "@/components/ui/masked-time-input";
import { CustomSelect } from "@/components/ui/custom-select";
import { atualizarReserva } from "@/lib/data/reservas-actions";
import type { Reserva } from "@/lib/data/reservas";

function formatData(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

export function ReservaDetalhesDialog({
  reserva,
  responsavelNome,
  atendentes,
}: {
  reserva: Reserva;
  responsavelNome: string;
  atendentes: { id: string; nome: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function fechar() {
    setOpen(false);
    setEditando(false);
    setError(null);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    const responsavel = String(formData.get("responsavel") ?? "");
    if (!responsavel) {
      setError("Selecione o responsável pela reserva.");
      return;
    }
    startTransition(async () => {
      const result = await atualizarReserva(reserva.id, {
        nome: String(formData.get("nome") ?? ""),
        cpf: String(formData.get("cpf") ?? ""),
        email: String(formData.get("email") ?? ""),
        horario: String(formData.get("horario") ?? ""),
        turno: formData.get("turno") === "jantar" ? "jantar" : "almoco",
        pessoas: Number(formData.get("pessoas") ?? 1),
        objetivo: String(formData.get("objetivo") ?? ""),
        observacao: String(formData.get("observacao") ?? ""),
        canal: formData.get("canal") === "online" ? "online" : "presencial",
        responsavelUserId: responsavel === "chatbot" ? null : responsavel,
      });
      if (result.ok) setEditando(false);
      else setError(result.error);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-[30px] shrink-0 items-center rounded-[8px] border border-[var(--color-border-soft)] px-3 text-[12.5px] font-medium text-[var(--color-text-secondary)] hover:bg-white/[0.05] hover:text-[var(--color-text-primary)]"
      >
        Ver detalhes
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={fechar}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-[440px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
                {editando ? "Editar reserva" : "Detalhes da reserva"}
              </h2>
              <div className="flex items-center gap-3">
                {!editando && reserva.status !== "cancelado" && (
                  <button
                    onClick={() => setEditando(true)}
                    className="flex h-8 items-center gap-1.5 rounded-[999px] border border-[var(--color-border-soft)] px-4 text-[12.5px] font-medium text-[var(--color-text-secondary)] hover:bg-white/[0.05]"
                  >
                    <Pencil size={13} />
                    Editar reserva
                  </button>
                )}
                <button onClick={fechar} className="text-[var(--color-text-muted)]">
                  <X size={18} />
                </button>
              </div>
            </div>

            {editando ? (
              <form action={handleSubmit} className="flex flex-col gap-3">
                <Field label="Nome do cliente">
                  <input name="nome" defaultValue={reserva.nome} required className="dialog-input" />
                </Field>
                <div className="flex gap-3">
                  <Field label="CPF" className="flex-1">
                    <input name="cpf" defaultValue={reserva.cpf ?? ""} className="dialog-input" />
                  </Field>
                  <Field label="E-mail" className="flex-1">
                    <input name="email" type="email" defaultValue={reserva.email ?? ""} className="dialog-input" />
                  </Field>
                </div>
                <div className="flex gap-3">
                  <Field label="Horário" className="flex-1">
                    <MaskedTimeInput name="horario" defaultValue={reserva.horario?.slice(0, 5)} required />
                  </Field>
                  <Field label="Pessoas" className="flex-1">
                    <input name="pessoas" type="number" min={1} defaultValue={reserva.pessoas} required className="dialog-input" />
                  </Field>
                </div>
                <div className="flex gap-3">
                  <Field label="Turno" className="flex-1">
                    <CustomSelect
                      name="turno"
                      defaultValue={reserva.turno}
                      options={[
                        { value: "almoco", label: "Almoço" },
                        { value: "jantar", label: "Jantar" },
                      ]}
                    />
                  </Field>
                  <Field label="Canal" className="flex-1">
                    <CustomSelect
                      name="canal"
                      defaultValue={reserva.canal}
                      options={[
                        { value: "presencial", label: "Presencial" },
                        { value: "online", label: "Online" },
                      ]}
                    />
                  </Field>
                </div>
                <Field label="Responsável pela reserva">
                  <CustomSelect
                    name="responsavel"
                    defaultValue={reserva.responsavelUserId ?? "chatbot"}
                    options={[
                      { value: "chatbot", label: "Chatbot IA" },
                      ...atendentes.map((a) => ({ value: a.id, label: a.nome })),
                    ]}
                  />
                </Field>
                <Field label="Ocasião (opcional)">
                  <input name="objetivo" defaultValue={reserva.objetivo ?? ""} className="dialog-input" />
                </Field>
                <Field label="Observação (opcional)">
                  <textarea
                    name="observacao"
                    defaultValue={reserva.observacao ?? ""}
                    rows={3}
                    className="dialog-input h-auto resize-y py-2"
                  />
                </Field>

                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Telefone, data e status não dá pra editar por aqui — telefone é a chave usada em todo o painel, e
                  data mexeria na capacidade de outro dia. Pra mudar isso, cancele e crie uma nova reserva.
                </p>

                {error && <p className="text-[12.5px] text-[var(--color-status-red)]">{error}</p>}

                <div className="mt-1 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditando(false)}
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
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="font-display text-[16px] font-semibold text-[var(--color-text-primary)]">{reserva.nome}</p>
                  <StatusBadge status={reserva.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <Info label="Telefone" value={reserva.telefone} />
                  <Info label="CPF" value={reserva.cpf ?? "—"} />
                  <Info label="E-mail" value={reserva.email ?? "—"} />
                  <Info label="Data" value={formatData(reserva.data)} />
                  <Info label="Horário" value={reserva.horario?.slice(0, 5)} />
                  <Info label="Pessoas" value={String(reserva.pessoas)} />
                  <Info label="Turno" value={reserva.turno === "jantar" ? "Jantar" : "Almoço"} />
                  <Info label="Canal" value={reserva.canal === "presencial" ? "Presencial" : "Online"} />
                  <Info label="Responsável" value={responsavelNome} />
                  <Info label="Ocasião" value={reserva.objetivo ?? "—"} />
                </div>

                <div className="flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-3">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Observação</span>
                  <p className="whitespace-pre-wrap text-[13.5px] leading-[1.5] text-[var(--color-text-primary)]">
                    {reserva.observacao || "Nenhuma observação registrada."}
                  </p>
                </div>

                {reserva.status === "cancelado" && reserva.motivoCancelamento && (
                  <div className="flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-3">
                    <span className="text-[12px] text-[var(--color-status-red)]">Motivo do cancelamento</span>
                    <p className="whitespace-pre-wrap text-[13.5px] leading-[1.5] text-[var(--color-text-primary)]">
                      {reserva.motivoCancelamento}
                    </p>
                  </div>
                )}

              </>
            )}
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11.5px] text-[var(--color-text-muted)]">{label}</span>
      <span className="text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}
