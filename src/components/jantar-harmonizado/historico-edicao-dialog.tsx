"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { listReservasEdicaoJH, type ReservaEdicaoJH } from "@/lib/data/jantar-harmonizado-actions";
import type { EdicaoHistoricoJH } from "@/lib/data/jantar-harmonizado";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatData(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

export function HistoricoEdicaoDialog({ edicao, children }: { edicao: EdicaoHistoricoJH; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [reservas, setReservas] = useState<ReservaEdicaoJH[] | null>(null);
  const [pending, startTransition] = useTransition();

  function abrir() {
    setOpen(true);
    if (reservas === null) {
      startTransition(async () => {
        const data = await listReservasEdicaoJH(edicao.dataEvento);
        setReservas(data);
      });
    }
  }

  return (
    <>
      <button type="button" onClick={abrir} className="w-full text-left">
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[80vh] w-[560px] flex-col gap-5 overflow-hidden rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <h2 className="font-display text-[16px] font-semibold text-[var(--color-text-primary)]">
                  {edicao.titulo || "Sem nome"}
                </h2>
                <p className="text-[12px] text-[var(--color-text-muted)]">
                  {formatData(edicao.dataEvento)} · {formatBRL(edicao.valorPessoa)} por pessoa
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="shrink-0 text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {pending || reservas === null ? (
                <p className="py-8 text-center text-[13px] text-[var(--color-text-muted)]">Carregando...</p>
              ) : reservas.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-[var(--color-text-muted)]">
                  Nenhuma reserva encontrada pra essa edição.
                </p>
              ) : (
                reservas.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-[14px] border border-white/5 bg-white/[0.02] px-4 py-3 text-[13px]"
                  >
                    <div className="flex flex-col gap-0.5">
                      <p className="font-medium text-[var(--color-text-primary)]">{r.nome}</p>
                      <p className="text-[11.5px] text-[var(--color-text-muted)]">
                        {r.pessoas} pessoa{r.pessoas === 1 ? "" : "s"} · {r.canal === "presencial" ? "Presencial" : "Online"}
                      </p>
                    </div>
                    <StatusBadge status={r.status === "cancelado" ? "cancelado" : r.statusPagamento} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
