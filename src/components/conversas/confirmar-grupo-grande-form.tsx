"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { criarReservaManual } from "@/lib/data/reservas-actions";
import { marcarConfirmacaoResolvida } from "@/lib/data/confirmacoes-gerente-actions";
import { toast } from "@/lib/toast";
import { DatePicker } from "@/components/ui/date-picker";
import { MaskedTimeInput } from "@/components/ui/masked-time-input";
import { CustomSelect } from "@/components/ui/custom-select";
import { useEscapeClose } from "@/hooks/use-escape-close";
import type { DetalheGrupoGrande } from "@/lib/confirmacoes-gerente-shared";

// Horário-palpite só pra não deixar o campo vazio -- o gerente já viu a
// disponibilidade real antes de abrir esse popup, então isso é só um ponto
// de partida editável, não uma tentativa de adivinhar certo.
const HORARIO_PADRAO: Record<"almoco" | "jantar", string> = { almoco: "12:30", jantar: "19:00" };

export function ConfirmarGrupoGrandeForm({
  id,
  telefone,
  detalhe,
  atendentes,
}: {
  id: number;
  telefone: string;
  detalhe: DetalheGrupoGrande;
  atendentes: { id: string; nome: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const turnoInicial = detalhe.turno ?? "almoco";

  useEscapeClose(open, () => setOpen(false));

  function confirmar(formData: FormData) {
    setErro(null);
    const responsavel = String(formData.get("responsavel") ?? "");
    if (!responsavel) {
      setErro("Selecione quem está confirmando.");
      return;
    }
    startTransition(async () => {
      const resultado = await criarReservaManual({
        nome: String(formData.get("nome") ?? ""),
        telefone,
        cpf: detalhe.cpf ?? "",
        email: detalhe.email ?? "",
        data: String(formData.get("data") ?? ""),
        horario: String(formData.get("horario") ?? ""),
        turno: formData.get("turno") === "jantar" ? "jantar" : "almoco",
        pessoas: Number(formData.get("pessoas") ?? detalhe.pessoas ?? 1),
        objetivo: String(formData.get("objetivo") ?? ""),
        canal: "online",
        observacao: "",
        responsavelUserId: responsavel === "chatbot" ? null : responsavel,
      });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      const resolvida = await marcarConfirmacaoResolvida(id, telefone);
      if (!resolvida.ok) {
        setErro(`Reserva criada, mas não consegui fechar a pendência: ${resolvida.error}`);
        return;
      }
      setOpen(false);
      toast("Reserva confirmada e registrada em Eventos.");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[999px] bg-[var(--color-status-red)] px-[12px] py-[4px] text-[12px] font-semibold text-[#2a0a0a]"
      >
        Confirmar reserva
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex w-[460px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
                Confirmar reserva de grupo grande
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <form action={confirmar} className="flex flex-col gap-3">
              <Field label="Nome do cliente">
                <input name="nome" defaultValue={detalhe.nome ?? ""} required className="dialog-input" />
              </Field>
              <div className="flex gap-3">
                <Field label="Data" className="flex-1">
                  <DatePicker name="data" defaultValue={detalhe.data ?? ""} required />
                </Field>
                <Field label="Horário" className="flex-1">
                  <MaskedTimeInput name="horario" defaultValue={detalhe.horario ?? HORARIO_PADRAO[turnoInicial]} required />
                </Field>
              </div>
              <div className="flex gap-3">
                <Field label="Turno" className="flex-1">
                  <CustomSelect
                    name="turno"
                    defaultValue={turnoInicial}
                    options={[
                      { value: "almoco", label: "Almoço" },
                      { value: "jantar", label: "Jantar" },
                    ]}
                  />
                </Field>
                <Field label="Pessoas" className="flex-1">
                  <input
                    name="pessoas"
                    type="number"
                    min={1}
                    defaultValue={detalhe.pessoas ?? 1}
                    required
                    className="dialog-input"
                  />
                </Field>
              </div>
              <Field label="Ocasião (opcional)">
                <input name="objetivo" defaultValue={detalhe.objetivo ?? ""} className="dialog-input" />
              </Field>
              <Field label="Confirmado por">
                <CustomSelect
                  name="responsavel"
                  placeholder="Quem está confirmando?"
                  options={atendentes.map((a) => ({ value: a.id, label: a.nome }))}
                />
              </Field>

              {erro && <p className="text-[12.5px] text-[var(--color-status-red)]">{erro}</p>}

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
                  {pending ? "Confirmando..." : "Confirmar reserva"}
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
