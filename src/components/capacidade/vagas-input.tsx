"use client";

import { useState, useTransition } from "react";
import { atualizarVagasDisponiveis } from "@/lib/data/capacidade-actions";

export function VagasInput({ id, valorInicial }: { id: number; valorInicial: number }) {
  const [valor, setValor] = useState(valorInicial);
  const [pending, startTransition] = useTransition();

  function commit() {
    if (valor === valorInicial) return;
    startTransition(async () => {
      const result = await atualizarVagasDisponiveis(id, valor);
      if (!result.ok) {
        alert(`Não deu pra salvar: ${result.error}`);
        setValor(valorInicial);
      }
    });
  }

  return (
    <input
      type="number"
      min={0}
      value={valor}
      disabled={pending}
      onChange={(e) => setValor(Number(e.target.value))}
      onBlur={commit}
      className="h-[34px] w-[90px] rounded-[999px] border border-[rgba(168,85,247,0.3)] bg-transparent text-center text-[13px] font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(168,85,247,0.5)] disabled:opacity-50"
    />
  );
}
