"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { excluirItemIfood } from "@/lib/data/ifood-actions";

export function DeleteItemIfoodButton({ id, nome }: { id: number; nome: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Excluir "${nome}"? Também remove do RAG que o bot usa.`)) return;
    startTransition(async () => {
      const result = await excluirItemIfood(id);
      if (!result.ok) alert(`Não deu certo: ${result.error}`);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title="Excluir item"
      className="flex size-[26px] items-center justify-center rounded-[8px] border border-white/10 text-[var(--color-text-muted)] hover:border-[var(--color-status-red)] hover:text-[var(--color-status-red)] disabled:opacity-50"
    >
      <Trash2 size={13} />
    </button>
  );
}
