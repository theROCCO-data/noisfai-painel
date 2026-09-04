"use client";

import { useState, useTransition } from "react";
import { Plus, X, Copy } from "lucide-react";
import { convidarUsuario } from "@/lib/data/usuarios-actions";
import { CustomSelect } from "@/components/ui/custom-select";
import { useEscapeClose } from "@/hooks/use-escape-close";

export function ConvidarUsuarioDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [criado, setCriado] = useState<{ email: string; senha: string; emailEnviado: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    if (!String(formData.get("cargo") ?? "").trim()) {
      setError("Selecione o cargo.");
      return;
    }
    startTransition(async () => {
      const result = await convidarUsuario(formData);
      if (result.ok && result.senhaTemporaria) {
        setCriado({ email: String(formData.get("email")), senha: result.senhaTemporaria, emailEnviado: !!result.emailEnviado });
      } else if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function fechar() {
    setOpen(false);
    setCriado(null);
    setError(null);
  }

  useEscapeClose(open, fechar);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-[34px] items-center gap-2 rounded-[999px] px-5 text-[13px] font-semibold text-white"
        style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
      >
        <Plus size={15} /> Convidar usuário
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex w-[420px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
                Convidar usuário
              </h2>
              <button onClick={fechar} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            {criado ? (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] text-[var(--color-text-primary)]">
                  Conta criada para <span className="font-semibold">{criado.email}</span>.{" "}
                  {criado.emailEnviado
                    ? "Um e-mail com o acesso já foi enviado pra essa pessoa."
                    : "Não deu pra enviar o e-mail automático — repasse essa senha temporária manualmente:"}
                </p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(criado.senha)}
                  className="flex items-center justify-between gap-2 rounded-[10px] border border-[var(--color-border-soft)] bg-white/[0.04] px-3 py-2.5 text-left"
                  title="Copiar"
                  aria-label="Copiar senha temporária"
                >
                  <span className="font-mono text-[13px] text-[var(--color-text-primary)]">{criado.senha}</span>
                  <Copy size={14} className="shrink-0 text-[var(--color-text-muted)]" />
                </button>
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
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Nome</span>
                  <input name="nome" required className="dialog-input" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">E-mail</span>
                  <input name="email" type="email" required className="dialog-input" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Cargo</span>
                  <CustomSelect
                    name="cargo"
                    placeholder="Selecione o cargo"
                    options={[
                      { value: "Desenvolvedor", label: "Desenvolvedor" },
                      { value: "Gerente", label: "Gerente" },
                      { value: "Proprietário", label: "Proprietário" },
                      { value: "Atendente", label: "Atendente" },
                      { value: "Garçom", label: "Garçom" },
                    ]}
                  />
                </label>

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
                    {pending ? "Criando..." : "Criar acesso"}
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
