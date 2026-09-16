"use client";

import { useState, useTransition } from "react";
import { marcarConfirmacaoResolvida } from "@/lib/data/confirmacoes-gerente-actions";

export function ConfirmarPendenciaButton({ id, telefone }: { id: number; telefone: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function confirmar() {
    setErro(null);
    startTransition(async () => {
      const result = await marcarConfirmacaoResolvida(id, telefone);
      if (!result.ok) setErro(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={confirmar}
        disabled={pending}
        className="rounded-[999px] bg-[var(--color-status-red)] px-[12px] py-[4px] text-[12px] font-semibold text-[#2a0a0a] disabled:opacity-60"
      >
        {pending ? "Confirmando…" : "Marcar como confirmado"}
      </button>
      {erro && <span className="text-[11px] text-[var(--color-status-red)]">{erro}</span>}
    </div>
  );
}
