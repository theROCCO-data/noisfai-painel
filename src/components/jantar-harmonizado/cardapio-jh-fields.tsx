"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { EtapaCardapioJH } from "@/lib/data/jantar-harmonizado";

/**
 * Editor das etapas do menu degustação (título + vinho + prato de cada
 * etapa) — usado tanto no dialog de "Editar edição"/"Nova edição" quanto no
 * popup de cardápio standalone. Serializa tudo num único hidden input JSON
 * (`cardapioEtapas`) pra funcionar com o padrão de Server Action + FormData
 * já usado no resto do painel.
 */
export function CardapioJHFields({
  defaultIntro,
  defaultPalestrante,
  defaultEtapas,
  defaultRegrasReserva,
}: {
  defaultIntro?: string | null;
  defaultPalestrante?: string | null;
  defaultEtapas?: EtapaCardapioJH[];
  defaultRegrasReserva?: string | null;
}) {
  const [etapas, setEtapas] = useState<EtapaCardapioJH[]>(
    defaultEtapas && defaultEtapas.length > 0 ? defaultEtapas : [{ titulo: "", vinho: "", prato: "" }]
  );

  function atualizarEtapa(i: number, campo: keyof EtapaCardapioJH, valor: string) {
    setEtapas((atual) => atual.map((e, idx) => (idx === i ? { ...e, [campo]: valor } : e)));
  }
  function adicionarEtapa() {
    setEtapas((atual) => [...atual, { titulo: "", vinho: "", prato: "" }]);
  }
  function removerEtapa(i: number) {
    setEtapas((atual) => atual.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--color-text-secondary)]">Descrição do menu (opcional)</span>
        <textarea
          name="cardapioIntro"
          defaultValue={defaultIntro ?? ""}
          placeholder="Ex: Menu degustação. Chef apresenta cada etapa antes do prato ser servido."
          className="dialog-input h-auto min-h-[70px] resize-none py-2.5 leading-[1.5]"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--color-text-secondary)]">Palestrante (opcional)</span>
        <input name="cardapioPalestrante" defaultValue={defaultPalestrante ?? ""} placeholder="Ex: Sabrina Trézze" className="dialog-input" />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-[var(--color-text-secondary)]">Etapas do menu</span>
        {etapas.map((etapa, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-[14px] border border-white/[0.08] bg-white/[0.02] p-3">
            <div className="flex items-center gap-2">
              <input
                value={etapa.titulo}
                onChange={(e) => atualizarEtapa(i, "titulo", e.target.value)}
                placeholder="Ex: Boas-vindas, Entrada, 1º Prato, Sobremesa..."
                className="dialog-input flex-1"
              />
              <button
                type="button"
                onClick={() => removerEtapa(i)}
                aria-label="Remover etapa"
                className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[var(--color-text-muted)] hover:bg-[rgba(248,113,113,0.12)] hover:text-[var(--color-status-red)]"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <input
              value={etapa.vinho}
              onChange={(e) => atualizarEtapa(i, "vinho", e.target.value)}
              placeholder="Vinho (opcional)"
              className="dialog-input"
            />
            <input
              value={etapa.prato}
              onChange={(e) => atualizarEtapa(i, "prato", e.target.value)}
              placeholder="Prato (opcional)"
              className="dialog-input"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={adicionarEtapa}
          className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-white/15 text-[12.5px] font-medium text-[var(--color-text-secondary)] hover:border-[rgba(168,85,247,0.4)] hover:text-[var(--color-accent)]"
        >
          <Plus size={13} /> Adicionar etapa
        </button>
      </div>

      <input type="hidden" name="cardapioEtapas" value={JSON.stringify(etapas.filter((e) => e.titulo || e.vinho || e.prato))} />

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--color-text-secondary)]">Regras de reserva/pagamento (opcional)</span>
        <textarea
          name="regrasReserva"
          defaultValue={defaultRegrasReserva ?? ""}
          placeholder="Ex: Reservas somente mediante pagamento PIX. Chave: CNPJ 00.000.000/0000-00"
          className="dialog-input h-auto min-h-[60px] resize-none py-2.5 leading-[1.5]"
        />
      </label>
    </div>
  );
}
