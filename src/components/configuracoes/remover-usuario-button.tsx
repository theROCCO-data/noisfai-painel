"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { excluirUsuario } from "@/lib/data/usuarios-actions";

export function RemoverUsuarioButton({ id, nome }: { id: string; nome: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm(`Remover o acesso de "${nome}" ao painel? Essa ação não pode ser desfeita.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await excluirUsuario(id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={pending}
        title="Remover usuário"
        className="flex size-[26px] items-center justify-center rounded-[8px] text-[var(--color-text-muted)] hover:bg-[rgba(248,113,113,0.12)] hover:text-[var(--color-status-red)] disabled:opacity-50"
      >
        <Trash2 size={14} />
      </button>
      {error && <span className="text-[11.5px] text-[var(--color-status-red)]">{error}</span>}
    </div>
  );
}
