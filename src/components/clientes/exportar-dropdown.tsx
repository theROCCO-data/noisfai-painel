"use client";

import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";

const FORMATOS = [
  { valor: "csv", label: "CSV" },
  { valor: "md", label: "Markdown" },
  { valor: "json", label: "JSON" },
];

export function ExportarDropdown({ q, de, ate }: { q?: string; de?: string; ate?: string }) {
  const [open, setOpen] = useState(false);

  function href(formato: string) {
    const params = new URLSearchParams({ formato });
    if (q) params.set("q", q);
    if (de) params.set("de", de);
    if (ate) params.set("ate", ate);
    return `/api/clientes/export?${params.toString()}`;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-[34px] items-center gap-2 rounded-[10px] border border-[var(--color-border-soft)] bg-white/[0.03] px-3 text-[13px] text-[var(--color-text-primary)]"
      >
        <Download size={14} className="text-[var(--color-text-muted)]" />
        Exportar
        <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[180px] overflow-hidden rounded-[14px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-1.5 shadow-xl">
            {FORMATOS.map((f) => (
              <a
                key={f.valor}
                href={href(f.valor)}
                onClick={() => setOpen(false)}
                className="flex w-full items-center rounded-[10px] px-3 py-2 text-left text-[13px] text-[var(--color-text-primary)] hover:bg-white/[0.06]"
              >
                {f.label}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
