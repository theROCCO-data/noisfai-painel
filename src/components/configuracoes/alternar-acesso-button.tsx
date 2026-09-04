"use client";

import { useState, useTransition } from "react";
import { Ban, RotateCcw } from "lucide-react";
import { alternarAcessoUsuario } from "@/lib/data/usuarios-actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/lib/toast";

export function AlternarAcessoButton({ id, nome, ativo }: { id: string; nome: string; ativo: boolean }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const result = await alternarAcessoUsuario(id, ativo);
      setConfirmando(false);
      if (result.ok) toast(ativo ? "Acesso desativado." : "Acesso reativado.");
      else alert(`Não deu certo: ${result.error}`);
    });
  }

  return (
    <>
      <button
        onClick={() => setConfirmando(true)}
        disabled={pending}
        title={ativo ? "Desativar acesso" : "Reativar acesso"}
        aria-label={ativo ? "Desativar acesso" : "Reativar acesso"}
        className={`flex size-[26px] shrink-0 items-center justify-center rounded-[8px] text-[var(--color-text-muted)] disabled:opacity-50 ${
          ativo ? "hover:bg-[rgba(251,191,36,0.12)] hover:text-[var(--color-status-amber)]" : "hover:bg-[rgba(74,222,128,0.12)] hover:text-[var(--color-status-green)]"
        }`}
      >
        {ativo ? <Ban size={13} /> : <RotateCcw size={13} />}
      </button>

      <ConfirmDialog
        open={confirmando}
        titulo={ativo ? "Desativar acesso" : "Reativar acesso"}
        mensagem={
          ativo
            ? `Desativar o acesso de "${nome}"? Ele(a) não vai mais conseguir entrar no painel, mas o histórico de reservas e atendimentos dele(a) é mantido.`
            : `Reativar o acesso de "${nome}"?`
        }
        confirmarLabel={ativo ? "Desativar" : "Reativar"}
        pending={pending}
        onConfirmar={confirmar}
        onCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
