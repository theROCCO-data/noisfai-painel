"use client";

import { useState } from "react";
import { CustomSelect } from "@/components/ui/custom-select";

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
    <div className="flex flex-col gap-1">
      <span className="text-[12px] text-[var(--color-text-muted)]">Categoria</span>
      <CustomSelect
        name="categoria"
        defaultValue={valorSelect}
        placeholder={categorias.length === 0 ? "Nenhuma categoria ainda" : "Selecione..."}
        options={[
          ...categorias.map((c) => ({ value: c, label: c })),
          { value: NOVA, label: "+ Criar nova categoria..." },
        ]}
        onChange={(v) => {
          if (v === NOVA) setCriandoNova(true);
          else setValorSelect(v);
        }}
      />
    </div>
  );
}
