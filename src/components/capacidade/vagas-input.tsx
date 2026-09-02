"use client";

import { useState, useTransition } from "react";
import { atualizarVagasDisponiveis } from "@/lib/data/capacidade-actions";

export function VagasInput({ id, valorInicial }: { id: number; valorInicial: number }) {
  const [texto, setTexto] = useState(String(valorInicial));
  const [pending, startTransition] = useTransition();

  function commit() {
    const novoValor = texto === "" ? 0 : Number(texto);
    setTexto(String(novoValor));
    if (novoValor === valorInicial) return;
    startTransition(async () => {
      const result = await atualizarVagasDisponiveis(id, novoValor);
      if (!result.ok) {
        alert(`Não deu pra salvar: ${result.error}`);
        setTexto(String(valorInicial));
      }
    });
  }

  return (
    <input
      type="number"
      min={0}
      value={texto}
      disabled={pending}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className="h-[34px] w-[90px] rounded-[999px] border border-[rgba(168,85,247,0.3)] bg-transparent text-center text-[13px] font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(168,85,247,0.5)] disabled:opacity-50"
    />
  );
}
