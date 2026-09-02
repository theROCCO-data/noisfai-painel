"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

function hojeISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function paraExibicao(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y) return "";
  return `${d}/${m}/${y}`;
}

export function DatePicker({
  name,
  defaultValue,
  required,
  bare,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  /** sem borda/fundo/padding próprios — pra quando o campo já mora dentro de outra caixa (ex.: filtro compacto) */
  bare?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(defaultValue ?? "");
  const base = valor || hojeISO();
  const [mesVisivel, setMesVisivel] = useState(() => {
    const [y, m] = base.split("-").map(Number);
    return { ano: y, mes: m - 1 };
  });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickFora(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickFora);
    return () => document.removeEventListener("click", handleClickFora);
  }, [open]);

  const primeiroDiaSemana = new Date(mesVisivel.ano, mesVisivel.mes, 1).getDay();
  const diasNoMes = new Date(mesVisivel.ano, mesVisivel.mes + 1, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  function mudarMes(delta: number) {
    setMesVisivel((atual) => {
      const novo = atual.mes + delta;
      if (novo < 0) return { ano: atual.ano - 1, mes: 11 };
      if (novo > 11) return { ano: atual.ano + 1, mes: 0 };
      return { ano: atual.ano, mes: novo };
    });
  }

  function selecionar(dia: number) {
    const iso = `${mesVisivel.ano}-${String(mesVisivel.mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    setValor(iso);
    setOpen(false);
  }

  function irParaHoje() {
    const iso = hojeISO();
    const [y, m] = iso.split("-").map(Number);
    setMesVisivel({ ano: y, mes: m - 1 });
    setValor(iso);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input type="hidden" name={name} value={valor} required={required} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          bare
            ? "flex items-center gap-1.5 bg-transparent text-[13px] text-left focus:outline-none"
            : "dialog-input flex items-center justify-between text-left"
        }
      >
        <span className={valor ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}>
          {valor ? paraExibicao(valor) : "dd/mm/aaaa"}
        </span>
        {!bare && <CalendarIcon size={14} className="shrink-0 text-[var(--color-text-muted)]" />}
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1.5 w-[260px] rounded-[14px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => mudarMes(-1)} className="flex size-6 items-center justify-center rounded-[6px] text-[var(--color-text-muted)] hover:bg-white/[0.06]">
              <ChevronLeft size={14} />
            </button>
            <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
              {MESES[mesVisivel.mes]} de {mesVisivel.ano}
            </span>
            <button type="button" onClick={() => mudarMes(1)} className="flex size-6 items-center justify-center rounded-[6px] text-[var(--color-text-muted)] hover:bg-white/[0.06]">
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DIAS_SEMANA.map((d, i) => (
              <span key={i} className="flex h-6 items-center justify-center text-[11px] text-[var(--color-text-muted)]">
                {d}
              </span>
            ))}
            {celulas.map((dia, i) => {
              const iso = dia ? `${mesVisivel.ano}-${String(mesVisivel.mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}` : null;
              const selecionadoAgora = iso === valor;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!dia}
                  onClick={() => dia && selecionar(dia)}
                  className={
                    !dia
                      ? "size-7"
                      : selecionadoAgora
                        ? "flex size-7 items-center justify-center rounded-[7px] bg-gradient-to-br from-[#a855f7] to-[#6d28d9] text-[12px] font-semibold text-white"
                        : "flex size-7 items-center justify-center rounded-[7px] text-[12px] text-[var(--color-text-primary)] hover:bg-white/[0.06]"
                  }
                >
                  {dia}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={irParaHoje}
            className="mt-2 w-full rounded-[8px] py-1.5 text-center text-[12px] text-[var(--color-accent)] hover:bg-white/[0.06]"
          >
            Hoje
          </button>
        </div>
      )}
    </div>
  );
}
