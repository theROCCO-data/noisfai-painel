"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { iniciarNovaConversa } from "@/lib/data/conversas-actions";
import { ModelosMensagemPopover } from "@/components/conversas/modelos-mensagem-popover";
import { MaskedPhoneInput } from "@/components/ui/masked-phone-input";
import { useEscapeClose } from "@/hooks/use-escape-close";
import { toast } from "@/lib/toast";
import type { ModeloMensagem } from "@/lib/data/modelos-mensagem";

export function NovaConversaDialog({
  trigger,
  telefoneInicial,
  nomeInicial,
  modelos = [],
  nomeAtendente = "",
}: {
  trigger?: React.ReactNode;
  telefoneInicial?: string;
  nomeInicial?: string;
  modelos?: ModeloMensagem[];
  nomeAtendente?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState("");
  const [montado, setMontado] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- só habilita o portal depois de montar no client
    setMontado(true);
  }, []);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await iniciarNovaConversa({
        telefone: String(formData.get("telefone") ?? ""),
        nome: String(formData.get("nome") ?? ""),
        mensagemInicial: String(formData.get("mensagemInicial") ?? ""),
      });
      if (result.ok && result.conversationId) {
        setOpen(false);
        toast("Conversa iniciada.");
        router.push(`/conversas/${result.conversationId}`);
      } else if (!result.ok) {
        setError(result.error);
      }
    });
  }

  useEscapeClose(open, () => setOpen(false));

  return (
    <>
      <button onClick={() => setOpen(true)}>
        {trigger ?? (
          <span
            className="flex h-[34px] shrink-0 items-center gap-2 rounded-[999px] px-5 shadow-[0px_14px_32px_-14px_rgba(168,85,247,0.5)]"
            style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
          >
            <Plus size={15} className="text-white" />
            <span className="text-[13px] font-semibold text-white">Nova conversa</span>
          </span>
        )}
      </button>

      {open && montado && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-[460px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">Nova conversa</h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Telefone</span>
                <MaskedPhoneInput name="telefone" defaultValue={telefoneInicial} required />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Nome (opcional)</span>
                <input name="nome" defaultValue={nomeInicial} className="dialog-input" />
              </label>
              <label className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Primeira mensagem</span>
                  <ModelosMensagemPopover
                    modelos={modelos}
                    nomeAtendente={nomeAtendente}
                    onSelecionar={setMensagem}
                    abrirPara="baixo"
                  />
                </div>
                <textarea
                  name="mensagemInicial"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  required
                  rows={4}
                  className="dialog-input h-auto py-2.5 leading-[1.6]"
                />
              </label>
              <p className="text-[11.5px] leading-[1.6] text-[var(--color-text-muted)]">
                A conversa abre já em atendimento humano — depois de 1h sem retomar, volta sozinha pro bot.
              </p>

              {error && <p className="text-[12.5px] text-[var(--color-status-red)]">{error}</p>}

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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
                  {pending ? "Enviando..." : "Iniciar conversa"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
