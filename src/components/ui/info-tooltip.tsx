"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { useEscapeClose } from "@/hooks/use-escape-close";

/**
 * Ícone redondo de "i" — clica pra ver uma explicação curta do que aquele
 * gráfico/número significa. O popup é renderizado num portal (document.body)
 * com posição calculada na hora — os cards que usam isso (KpiCard) têm
 * `overflow-hidden` pro efeito de brilho, então um popup posicionado
 * normalmente (absolute dentro do card) ficaria cortado.
 */
export function InfoTooltip({ texto }: { texto: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  function abrir() {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    }
    setOpen((o) => !o);
  }

  useEscapeClose(open, () => setOpen(false));

  return (
    <span className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          abrir();
        }}
        title="O que é isso?"
        aria-label="O que é isso?"
        className="flex size-[16px] shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-white/[0.08] hover:text-[var(--color-text-secondary)]"
      >
        <Info size={12} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
            <div
              className="fixed z-[9999] w-[220px] -translate-x-1/2 rounded-[12px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-3 text-[11.5px] font-normal leading-[1.6] normal-case tracking-normal text-[var(--color-text-secondary)] shadow-xl"
              style={{ top: pos.top, left: pos.left }}
            >
              {texto}
            </div>
          </>,
          document.body
        )}
    </span>
  );
}
