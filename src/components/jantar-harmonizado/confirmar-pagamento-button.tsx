"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { confirmarPagamentoJH } from "@/lib/data/jantar-harmonizado-actions";

export function ConfirmarPagamentoButton({ reservaId }: { reservaId: number }) {
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const result = await confirmarPagamentoJH(reservaId);
      if (!result.ok) alert(`Não deu pra confirmar: ${result.error}`);
    });
  }

  return (
    <button
      type="button"
      onClick={confirmar}
      disabled={pending}
      className="flex h-[26px] shrink-0 items-center gap-1 rounded-[999px] bg-[rgba(74,222,128,0.13)] px-[10px] text-[11.5px] font-semibold text-[var(--color-status-green)] hover:bg-[rgba(74,222,128,0.22)] disabled:opacity-50"
    >
      <Check size={12} />
      {pending ? "Confirmando..." : "Confirmar pagamento"}
    </button>
  );
}
