"use client";

import { useState } from "react";

const NOVA = "__nova__";

export function CategoriaField({
  categorias,
  defaultValue,
}: {
  categorias: string[];
  defaultValue?: string;
}) {
  const existeNaLista = defaultValue ? categorias.includes(defaultValue) : true;
  const [criandoNova, setCriandoNova] = useState(!existeNaLista && !!defaultValue);
  const [valorSelect, setValorSelect] = useState(existeNaLista ? (defaultValue ?? "") : NOVA);

  if (criandoNova) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[12px] text-[var(--color-text-muted)]">Categoria</span>
        <div className="flex gap-2">
          <input name="categoria" defaultValue={defaultValue && !existeNaLista ? defaultValue : ""} required autoFocus className="dialog-input" placeholder="Nome da nova categoria" />
          {categorias.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setCriandoNova(false);
                setValorSelect(categorias[0]);
              }}
              className="shrink-0 whitespace-nowrap text-[12px] text-[var(--color-accent)]"
            >
              usar existente
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] text-[var(--color-text-muted)]">Categoria</span>
      <select
        name="categoria"
        required
        className="dialog-input"
        value={valorSelect}
        onChange={(e) => {
          if (e.target.value === NOVA) setCriandoNova(true);
          else setValorSelect(e.target.value);
        }}
      >
        {categorias.length === 0 && <option value="">Nenhuma categoria ainda</option>}
        {categorias.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        <option value={NOVA}>+ Criar nova categoria...</option>
      </select>
    </label>
  );
}
