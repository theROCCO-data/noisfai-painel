"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

function hojeISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}
function somarDias(iso: string, dias: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString("en-CA");
}

const PRESETS = [
  { label: "Hoje", get: () => ({ de: hojeISO(), ate: hojeISO() }) },
  {
    label: "Esta semana",
    get: () => {
      const hoje = new Date(hojeISO() + "T00:00:00");
      const diaSemana = hoje.getDay();
      return { de: hojeISO(), ate: somarDias(hojeISO(), 6 - diaSemana) };
    },
  },
  {
    label: "Este mês",
    get: () => {
      const hoje = new Date();
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toLocaleDateString("en-CA");
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toLocaleDateString("en-CA");
      return { de: inicio, ate: fim };
    },
  },
];

export function PeriodoDropdown({
  q,
  status,
  canal,
  dataDe,
  dataAte,
}: {
  q?: string;
  status?: string;
  canal?: string;
  dataDe?: string;
  dataAte?: string;
}) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const router = useRouter();

  function aplicar(de: string | undefined, ate: string | undefined) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (canal) params.set("canal", canal);
    if (de) params.set("dataDe", de);
    if (ate) params.set("dataAte", ate);
    // sem de/ate explícito, marca "todos" — senão a tela reaplicaria o
    // padrão de "esta semana" sozinha de novo
    if (!de && !ate) params.set("periodo", "todos");
    router.push(`/reservas?${params.toString()}`);
    setOpen(false);
    setCustomOpen(false);
  }

  const formatCurto = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  const label = dataDe && dataAte
    ? `${formatCurto(dataDe)} – ${formatCurto(dataAte)}`
    : "Filtrar por data";

  return (
    <div className="relative w-full sm:w-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-[34px] w-full shrink-0 items-center gap-2 whitespace-nowrap rounded-[10px] border border-[var(--color-border-soft)] bg-white/[0.03] px-3 text-[12.5px] text-[var(--color-text-primary)] sm:w-auto"
      >
        <Calendar size={14} className="shrink-0 text-[var(--color-text-muted)]" />
        {label}
        <ChevronDown size={14} className="shrink-0 text-[var(--color-text-muted)]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-50 mt-2 w-[220px] overflow-hidden rounded-[14px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-1.5 shadow-xl">
            {dataDe && (
              <button
                onClick={() => aplicar(undefined, undefined)}
                className="flex w-full items-center rounded-[10px] px-3 py-2 text-left text-[13px] text-[var(--color-status-red)] hover:bg-white/[0.06]"
              >
                Limpar filtro
              </button>
            )}
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  const { de, ate } = p.get();
                  aplicar(de, ate);
                }}
                className="flex w-full items-center rounded-[10px] px-3 py-2 text-left text-[13px] text-[var(--color-text-primary)] hover:bg-white/[0.06]"
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setCustomOpen(true)}
              className="flex w-full items-center rounded-[10px] px-3 py-2 text-left text-[13px] text-[var(--color-accent)] hover:bg-white/[0.06]"
            >
              Personalizado...
            </button>
          </div>
        </>
      )}

      {customOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              aplicar(String(fd.get("de")), String(fd.get("ate")));
            }}
            className="flex w-[340px] flex-col gap-3 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <h2 className="font-display text-[16px] font-semibold text-[var(--color-text-primary)]">Período personalizado</h2>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] text-[var(--color-text-muted)]">De</span>
              <DatePicker name="de" required defaultValue={dataDe ?? hojeISO()} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] text-[var(--color-text-muted)]">Até</span>
              <DatePicker name="ate" required defaultValue={dataAte ?? hojeISO()} />
            </label>
            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="h-9 rounded-[999px] border border-white/[0.14] px-5 text-[13px] font-medium text-[var(--color-text-secondary)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-9 rounded-[999px] px-5 text-[13px] font-semibold text-white"
                style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
              >
                Aplicar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
