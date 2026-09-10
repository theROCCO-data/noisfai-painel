"use client";

import { useState, useTransition } from "react";
import { KeyRound, X, Eye, EyeOff } from "lucide-react";
import { alterarSenhaPropria } from "@/lib/auth-actions";
import { useEscapeClose } from "@/hooks/use-escape-close";

function CampoSenha({ name, label }: { name: string; label: string }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] text-[var(--color-text-muted)]">{label}</span>
      <div className="relative">
        <input
          name={name}
          type={visivel ? "text" : "password"}
          required
          minLength={8}
          className="dialog-input w-full pr-10"
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        >
          {visivel ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

export function AlterarSenhaDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [pending, startTransition] = useTransition();

  function fechar() {
    setOpen(false);
    setError(null);
    setSucesso(false);
  }

  useEscapeClose(open, fechar);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await alterarSenhaPropria(formData);
      if ("ok" in result) setSucesso(true);
      else setError(result.error);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-[34px] items-center gap-2 rounded-[999px] border border-white/[0.14] px-5 text-[13px] font-medium text-[var(--color-text-secondary)]"
      >
        <KeyRound size={15} /> Modificar senha
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex w-[420px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
                Modificar senha
              </h2>
              <button onClick={fechar} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            {sucesso ? (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] text-[var(--color-text-primary)]">
                  Senha alterada com sucesso. Use a nova senha no próximo login.
                </p>
                <button
                  type="button"
                  onClick={fechar}
                  className="mt-1 h-9 rounded-[999px] px-5 text-[13px] font-semibold text-white"
                  style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
                >
                  Concluído
                </button>
              </div>
            ) : (
              <form action={handleSubmit} className="flex flex-col gap-3">
                <CampoSenha name="senha" label="Nova senha" />
                <CampoSenha name="confirmarSenha" label="Confirmar nova senha" />
                <p className="text-[11.5px] text-[var(--color-text-muted)]">Mínimo de 8 caracteres.</p>

                {error && <p className="text-[12.5px] text-[var(--color-status-red)]">{error}</p>}

                <div className="mt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={fechar}
                    className="h-9 rounded-[999px] border border-white/[0.14] px-5 text-[13px] font-medium text-[var(--color-text-secondary)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="h-9 rounded-[999px] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
                    style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
                  >
                    {pending ? "Salvando..." : "Salvar nova senha"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
