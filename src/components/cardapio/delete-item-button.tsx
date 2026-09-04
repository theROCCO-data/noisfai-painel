"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { excluirItemCardapio } from "@/lib/data/cardapio-actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/lib/toast";

export function DeleteItemButton({ id, nome }: { id: number; nome: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();

  function excluir() {
    startTransition(async () => {
      const result = await excluirItemCardapio(id);
      setConfirmando(false);
      if (result.ok) toast("Prato excluído.");
      else alert(`Não deu certo: ${result.error}`);
    });
  }

  return (
    <>
      <button
        onClick={() => setConfirmando(true)}
        disabled={pending}
        title="Excluir prato"
        aria-label="Excluir prato"
        className="flex size-[26px] items-center justify-center rounded-[8px] border border-white/10 text-[var(--color-text-muted)] hover:border-[var(--color-status-red)] hover:text-[var(--color-status-red)] disabled:opacity-50"
      >
        <Trash2 size={13} />
      </button>

      <ConfirmDialog
        open={confirmando}
        titulo="Excluir prato"
        mensagem={`Excluir "${nome}"? Também remove do RAG que o bot usa.`}
        confirmarLabel="Excluir"
        pending={pending}
        onConfirmar={excluir}
        onCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
