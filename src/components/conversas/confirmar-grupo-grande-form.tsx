"use client";

import { useState, useTransition } from "react";
import { criarReservaManual } from "@/lib/data/reservas-actions";
import { marcarConfirmacaoResolvida } from "@/lib/data/confirmacoes-gerente-actions";
import { toast } from "@/lib/toast";
import { DatePicker } from "@/components/ui/date-picker";
import { MaskedTimeInput } from "@/components/ui/masked-time-input";
import { CustomSelect } from "@/components/ui/custom-select";
import type { DetalheGrupoGrande } from "@/lib/confirmacoes-gerente-shared";

// Horário-palpite só pra não deixar o campo vazio -- o gerente já viu a
// disponibilidade real antes de clicar aqui, então isso é só um ponto de
// partida editável, não uma tentativa de adivinhar certo.
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
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const turnoInicial = detalhe.turno ?? "almoco";

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
      toast("Reserva confirmada e registrada em Eventos.");
    });
  }

  return (
    <form action={confirmar} className="flex w-full flex-wrap items-end gap-2 py-1">
      <MiniField label="Nome">
        <input name="nome" defaultValue={detalhe.nome ?? ""} required className="dialog-input h-8 w-[160px]" />
      </MiniField>
      <MiniField label="Data">
        <DatePicker name="data" defaultValue={detalhe.data ?? ""} required />
      </MiniField>
      <MiniField label="Turno">
        <CustomSelect
          name="turno"
          defaultValue={turnoInicial}
          options={[
            { value: "almoco", label: "Almoço" },
            { value: "jantar", label: "Jantar" },
          ]}
        />
      </MiniField>
      <MiniField label="Horário">
        <MaskedTimeInput name="horario" defaultValue={detalhe.horario ?? HORARIO_PADRAO[turnoInicial]} required />
      </MiniField>
      <MiniField label="Pessoas">
        <input
          name="pessoas"
          type="number"
          min={1}
          defaultValue={detalhe.pessoas ?? 1}
          required
          className="dialog-input h-8 w-[70px]"
        />
      </MiniField>
      <MiniField label="Ocasião">
        <input
          name="objetivo"
          defaultValue={detalhe.objetivo ?? ""}
          className="dialog-input h-8 w-[140px]"
        />
      </MiniField>
      <MiniField label="Confirmado por">
        <CustomSelect
          name="responsavel"
          placeholder="Quem confirmou?"
          options={atendentes.map((a) => ({ value: a.id, label: a.nome }))}
        />
      </MiniField>
      <button
        type="submit"
        disabled={pending}
        className="h-8 shrink-0 rounded-[999px] bg-[var(--color-status-red)] px-4 text-[12px] font-semibold text-[#2a0a0a] disabled:opacity-60"
      >
        {pending ? "Confirmando…" : "Confirmar reserva"}
      </button>
      {erro && <span className="w-full text-[11px] text-[var(--color-status-red)]">{erro}</span>}
    </form>
  );
}

function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}
