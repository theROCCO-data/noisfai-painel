"use client";

import { useState, useTransition } from "react";
import { Info, X, Pencil, Wine } from "lucide-react";
import { atualizarCardapioJH } from "@/lib/data/jantar-harmonizado-actions";
import { toast } from "@/lib/toast";
import { useEscapeClose } from "@/hooks/use-escape-close";
import { CardapioJHFields } from "@/components/jantar-harmonizado/cardapio-jh-fields";
import type { EdicaoJH } from "@/lib/data/jantar-harmonizado";

export function CardapioJHDialog({ edicao }: { edicao: EdicaoJH }) {
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const preenchido = edicao.cardapioEtapas.length > 0 || !!edicao.cardapioIntro || !!edicao.regrasReserva;

  function fechar() {
    setOpen(false);
    setEditando(false);
    setError(null);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await atualizarCardapioJH(edicao.id, formData);
      if (result.ok) {
        setEditando(false);
        toast("Cardápio salvo.");
      } else {
        setError(result.error);
      }
    });
  }

  useEscapeClose(open, fechar);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Ver cardápio do jantar harmonizado"
        aria-label="Ver cardápio do jantar harmonizado"
        className="flex size-[16px] shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-white/[0.08] hover:text-[var(--color-text-secondary)]"
      >
        <Info size={12} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={fechar}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-[480px] flex-col gap-4 overflow-y-auto rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">Cardápio — {edicao.titulo}</h2>
              <button onClick={fechar} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            {editando ? (
              <form action={handleSubmit} className="flex flex-col gap-4">
                <CardapioJHFields
                  defaultIntro={edicao.cardapioIntro}
                  defaultPalestrante={edicao.cardapioPalestrante}
                  defaultEtapas={edicao.cardapioEtapas}
                  defaultRegrasReserva={edicao.regrasReserva}
                />

                {error && <p className="text-[12.5px] text-[var(--color-status-red)]">{error}</p>}

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditando(false)}
                    className="h-9 rounded-[999px] border border-[rgba(255,255,255,0.14)] px-4 text-[13px] text-[var(--color-text-secondary)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="h-9 rounded-[999px] px-4 text-[13px] font-semibold text-white disabled:opacity-60"
                    style={{ backgroundImage: "linear-gradient(90deg, #a855f7, #6d28d9)" }}
                  >
                    {pending ? "Salvando..." : "Salvar cardápio"}
                  </button>
                </div>
              </form>
            ) : preenchido ? (
              <>
                <div className="flex flex-col gap-4">
                  {edicao.cardapioIntro && (
                    <p className="text-[13px] leading-[1.6] text-[var(--color-text-secondary)]">{edicao.cardapioIntro}</p>
                  )}
                  {edicao.cardapioPalestrante && (
                    <p className="text-[12.5px] text-[var(--color-text-muted)]">
                      Palestrante: <span className="text-[var(--color-text-secondary)]">{edicao.cardapioPalestrante}</span>
                    </p>
                  )}
                  <div className="flex flex-col gap-3">
                    {edicao.cardapioEtapas.map((etapa, i) => (
                      <div key={i} className="flex flex-col gap-1 rounded-[14px] border border-white/[0.08] bg-white/[0.02] p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--color-accent)]">{etapa.titulo}</p>
                        {etapa.vinho && (
                          <p className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-primary)]">
                            <Wine size={12} className="shrink-0 text-[var(--color-text-muted)]" />
                            {etapa.vinho}
                          </p>
                        )}
                        {etapa.prato && <p className="text-[13px] text-[var(--color-text-secondary)]">{etapa.prato}</p>}
                      </div>
                    ))}
                  </div>
                  {edicao.regrasReserva && (
                    <div className="flex flex-col gap-1 rounded-[14px] border border-[rgba(251,191,36,0.22)] bg-[rgba(251,191,36,0.06)] p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--color-status-amber)]">
                        Regras de reserva/pagamento
                      </p>
                      <p className="text-[12.5px] leading-[1.5] text-[var(--color-text-secondary)]">{edicao.regrasReserva}</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="flex h-9 items-center justify-center gap-1.5 self-end rounded-[999px] border border-[var(--color-border-soft)] px-4 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-white/[0.03]"
                >
                  <Pencil size={13} /> Editar cardápio
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-[13px] text-[var(--color-text-muted)]">Nenhuma informação de cardápio cadastrada ainda.</p>
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="flex h-9 items-center gap-1.5 rounded-[999px] px-4 text-[13px] font-semibold text-white"
                  style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
                >
                  <Pencil size={13} /> Preencher cardápio
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
