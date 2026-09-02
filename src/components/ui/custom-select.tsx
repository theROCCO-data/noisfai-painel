"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export function CustomSelect({
  name,
  options,
  defaultValue,
  placeholder = "Selecione...",
  onChange,
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  placeholder?: string;
  onChange?: (valor: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(defaultValue ?? "");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selecionado = options.find((o) => o.value === valor);

  useEffect(() => {
    if (!open) return;
    function handleClickFora(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    // "click" (não "mousedown") pra não fechar antes do onClick da opção disparar
    document.addEventListener("click", handleClickFora);
    return () => document.removeEventListener("click", handleClickFora);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <input type="hidden" name={name} value={valor} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="dialog-input flex items-center justify-between text-left"
      >
        <span className={selecionado ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}>
          {selecionado?.label ?? placeholder}
        </span>
        <ChevronDown size={14} className="shrink-0 text-[var(--color-text-muted)]" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-[10px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-1 shadow-xl">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                setValor(o.value);
                setOpen(false);
                onChange?.(o.value);
              }}
              className="flex w-full items-center rounded-[8px] px-3 py-2 text-left text-[13px] text-[var(--color-text-primary)] hover:bg-white/[0.06]"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
