"use client";

import { useRef, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { atualizarCapacidadeTotal } from "@/lib/data/capacidade-actions";

export function CapacidadeTotalInput({ id, valorInicial }: { id: number; valorInicial: number }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(valorInicial);
  const [pending, startTransition] = useTransition();
  const valorAnterior = useRef(valorInicial);

  function commit() {
    setEditando(false);
    if (valor === valorAnterior.current) return;
    startTransition(async () => {
      const result = await atualizarCapacidadeTotal(id, valor);
      if (!result.ok) {
        alert(`Não deu pra salvar: ${result.error}`);
        setValor(valorAnterior.current);
      } else {
        valorAnterior.current = valor;
      }
    });
  }

  if (editando) {
    return (
      <input
        type="number"
        min={0}
        autoFocus
        value={valor}
        disabled={pending}
        onChange={(e) => setValor(Number(e.target.value))}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="h-[28px] w-[70px] rounded-[999px] border border-[rgba(168,85,247,0.3)] bg-transparent text-center text-[13px] font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(168,85,247,0.5)] disabled:opacity-50"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      title="Alterar capacidade total do dia"
      disabled={pending}
      className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
    >
      {valor}
      <Pencil size={12} className="text-[var(--color-text-muted)]" />
    </button>
  );
}
