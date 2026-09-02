"use client";

import { useState, useTransition } from "react";
import { Send, Bot } from "lucide-react";
import { enviarMensagem } from "@/lib/data/status-humano-actions";

export function Composer({
  telefone,
  conversationId,
  humano,
}: {
  telefone: string;
  conversationId: string;
  humano: boolean;
}) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar() {
    if (!texto.trim() || pending || !humano) return;
    setError(null);
    const mensagem = texto;
    startTransition(async () => {
      const result = await enviarMensagem(telefone, mensagem, conversationId);
      if (result.ok) setTexto("");
      else setError(result.error);
    });
  }

  if (!humano) {
    return (
      <div className="flex w-full shrink-0 items-center gap-2.5 border-t border-[var(--color-border)] bg-[rgba(168,85,247,0.05)] px-[22px] py-4">
        <Bot size={16} className="shrink-0 text-[#d8b4fe]" />
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          A IA está respondendo essa conversa agora. Clique em <span className="font-semibold text-[#d8b4fe]">&quot;Iniciar Atendimento Humano&quot;</span> acima para assumir e poder enviar mensagens.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full shrink-0 flex-col gap-1.5 border-t border-[var(--color-border)] px-[22px] py-4">
      <div className="flex w-full items-center gap-[10px]">
        <div className="flex h-[38px] flex-1 items-center rounded-[16px] border border-[var(--color-border-soft)] bg-white/[0.04] px-5">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            placeholder="Digite uma mensagem para o cliente"
            className="w-full bg-transparent text-[15px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />
        </div>
        <button
          onClick={enviar}
          disabled={pending || !texto.trim()}
          className="flex h-[38px] shrink-0 items-center gap-2 rounded-[16px] px-[26px] text-white shadow-[0px_14px_32px_-14px_rgba(168,85,247,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
        >
          <span className="text-[15px] font-semibold">{pending ? "Enviando..." : "Enviar"}</span>
          <Send size={18} />
        </button>
      </div>
      {error && <p className="text-[12px] text-[var(--color-status-red)]">Não deu pra enviar: {error}</p>}
    </div>
  );
}
