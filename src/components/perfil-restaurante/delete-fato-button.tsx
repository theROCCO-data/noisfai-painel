"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { excluirFatoRestaurante } from "@/lib/data/perfil-restaurante-actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/lib/toast";

export function DeleteFatoButton({ id, topico }: { id: number; topico: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();

  function excluir() {
    startTransition(async () => {
      const result = await excluirFatoRestaurante(id);
      setConfirmando(false);
      if (result.ok) toast("Informação removida.");
      else alert(`Não deu certo: ${result.error}`);
    });
  }

  return (
    <>
      <button
        onClick={() => setConfirmando(true)}
        disabled={pending}
        title="Excluir"
        aria-label={`Excluir ${topico}`}
        className="flex size-[26px] shrink-0 items-center justify-center rounded-[8px] text-[var(--color-text-muted)] hover:bg-[rgba(248,113,113,0.12)] hover:text-[var(--color-status-red)] disabled:opacity-50"
      >
        <Trash2 size={13} />
      </button>

      <ConfirmDialog
        open={confirmando}
        titulo="Excluir informação"
        mensagem={`Excluir "${topico}"?`}
        confirmarLabel="Excluir"
        pending={pending}
        onConfirmar={excluir}
        onCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
