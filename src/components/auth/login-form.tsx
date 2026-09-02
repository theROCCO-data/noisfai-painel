"use client";

import { useState, useTransition } from "react";
import { signIn } from "@/lib/auth-actions";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [avisoSenha, setAvisoSenha] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="flex w-full flex-col gap-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[22px] font-semibold text-[var(--color-text-primary)]">Bem-vindo de volta</h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">Entre com suas credenciais para continuar</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--color-text-secondary)]">E-mail</span>
        <input name="email" type="email" required placeholder="seu@email.com" className="dialog-input h-[42px]" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--color-text-secondary)]">Senha</span>
        <input name="password" type="password" required placeholder="••••••••" className="dialog-input h-[42px]" />
      </label>

      <div className="-mt-2.5 flex flex-col items-end gap-1.5">
        <button
          type="button"
          onClick={() => setAvisoSenha((v) => !v)}
          className="text-[12.5px] font-medium text-[#a78bfa] hover:underline"
        >
          Esqueceu sua senha?
        </button>
        {avisoSenha && (
          <p className="text-right text-[12px] text-[var(--color-text-muted)]">
            Fale com um desenvolvedor, proprietário ou gerente pra redefinir sua senha.
          </p>
        )}
      </div>

      {error && <p className="text-[13px] text-[var(--color-status-red)]">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-[42px] w-full rounded-[12px] text-[15px] font-semibold text-white disabled:opacity-60"
        style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
