"use client";

import { useState } from "react";
import {
  ScrollText,
  X,
  ArrowLeft,
  Folder,
  ChevronRight,
  Plus,
  Pencil,
  CalendarCheck,
  Building2,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { FatoDialog } from "@/components/perfil-restaurante/fato-dialog";
import { DeleteFatoButton } from "@/components/perfil-restaurante/delete-fato-button";
import { useEscapeClose } from "@/hooks/use-escape-close";
import type { FatoRestaurante } from "@/lib/data/perfil-restaurante";

const ICONES_CATEGORIA: Record<string, LucideIcon> = {
  Reservas: CalendarCheck,
  Estrutura: Building2,
  Cardápio: BookOpen,
};

export function RegrasComandosDialog({ fatos }: { fatos: FatoRestaurante[] }) {
  const [open, setOpen] = useState(false);
  const [pasta, setPasta] = useState<string | null>(null);

  const categorias = Array.from(new Set(fatos.map((f) => f.categoria)));
  const itensDaPasta = pasta ? fatos.filter((f) => f.categoria === pasta) : [];

  function fechar() {
    setOpen(false);
    setPasta(null);
  }

  useEscapeClose(open, () => (pasta ? setPasta(null) : fechar()));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-[999px] px-4 text-[13px] font-semibold text-white shadow-[0px_10px_22px_-12px_rgba(168,85,247,0.6)]"
        style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
      >
        <ScrollText size={14} />
        Regras e comandos
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={fechar}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[560px] w-full max-w-[560px] flex-col gap-4 overflow-hidden rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {pasta && (
                  <button
                    onClick={() => setPasta(null)}
                    aria-label="Voltar"
                    className="flex size-7 items-center justify-center rounded-[8px] text-[var(--color-text-muted)] hover:bg-white/[0.06] hover:text-[var(--color-text-primary)]"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
                  {pasta ?? "Regras e comandos"}
                </h2>
              </div>
              <button onClick={fechar} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            {!pasta && (
              <p className="-mt-2 text-[11.5px] leading-[1.5] text-[var(--color-text-muted)]">
                Regras, políticas e outras informações de referência do restaurante, organizadas por assunto — a mesma
                base que hoje alimenta o RAG do bot via planilha.
              </p>
            )}

            <FatoDialog
              categorias={categorias}
              trigger={
                <span className="flex h-9 w-fit items-center gap-1.5 rounded-[10px] border border-dashed border-white/15 px-3.5 text-[12.5px] font-medium text-[var(--color-text-secondary)] hover:border-[rgba(168,85,247,0.4)] hover:text-[var(--color-accent)]">
                  <Plus size={13} /> Nova regra{pasta ? ` em "${pasta}"` : ""}
                </span>
              }
            />

            <div className="flex-1 overflow-y-auto">
              {!pasta ? (
                categorias.length === 0 ? (
                  <p className="py-10 text-center text-[13px] text-[var(--color-text-muted)]">Nenhuma regra cadastrada ainda.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {categorias.map((categoria) => {
                      const Icone = ICONES_CATEGORIA[categoria] ?? Folder;
                      const qtd = fatos.filter((f) => f.categoria === categoria).length;
                      return (
                        <button
                          key={categoria}
                          onClick={() => setPasta(categoria)}
                          className="flex items-center gap-3 rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-4 text-left hover:border-[rgba(168,85,247,0.35)] hover:bg-white/[0.04]"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[rgba(168,85,247,0.12)] text-[#d8b4fe]">
                            <Icone size={18} />
                          </span>
                          <div className="flex flex-1 flex-col gap-0.5">
                            <p className="text-[13.5px] font-medium text-[var(--color-text-primary)]">{categoria}</p>
                            <p className="text-[11.5px] text-[var(--color-text-muted)]">
                              {qtd} {qtd === 1 ? "regra" : "regras"}
                            </p>
                          </div>
                          <ChevronRight size={15} className="shrink-0 text-[var(--color-text-muted)]" />
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-2">
                  {itensDaPasta.map((fato) => (
                    <div key={fato.id} className="flex items-start justify-between gap-3 rounded-[14px] border border-white/[0.08] bg-white/[0.02] p-3.5">
                      <div className="flex flex-1 flex-col gap-1">
                        <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{fato.topico}</p>
                        <p className="text-[12.5px] leading-[1.5] text-[var(--color-text-secondary)]">{fato.informacao}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <FatoDialog
                          fato={fato}
                          categorias={categorias}
                          trigger={
                            <span
                              title="Editar"
                              aria-label={`Editar ${fato.topico}`}
                              className="flex size-[26px] items-center justify-center rounded-[8px] text-[var(--color-text-muted)] hover:bg-white/[0.06] hover:text-[var(--color-text-secondary)]"
                            >
                              <Pencil size={13} />
                            </span>
                          }
                        />
                        <DeleteFatoButton id={fato.id} topico={fato.topico} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
