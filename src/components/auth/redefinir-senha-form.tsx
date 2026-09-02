"use client";

import { useState, useTransition } from "react";
import { redefinirSenha } from "@/lib/auth-actions";

export function RedefinirSenhaForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await redefinirSenha(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[22px] font-semibold text-[var(--color-text-primary)]">Nova senha</h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">Escolha uma senha nova pra sua conta</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--color-text-secondary)]">Nova senha</span>
        <input
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className="dialog-input h-[42px]"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--color-text-secondary)]">Confirmar senha</span>
        <input
          name="confirmarSenha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className="dialog-input h-[42px]"
        />
      </label>

      {error && <p className="text-[13px] text-[var(--color-status-red)]">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-[42px] w-full rounded-[12px] text-[15px] font-semibold text-white disabled:opacity-60"
        style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
      >
        {pending ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
