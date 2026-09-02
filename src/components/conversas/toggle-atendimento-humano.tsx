"use client";

import { useTransition } from "react";
import { Undo2, UserRound } from "lucide-react";
import { iniciarAtendimentoHumano, finalizarAtendimentoHumano } from "@/lib/data/status-humano-actions";

export function ToggleAtendimentoHumano({
  telefone,
  conversationId,
  humano,
}: {
  telefone: string;
  conversationId: string;
  humano: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = humano
        ? await finalizarAtendimentoHumano(telefone, conversationId)
        : await iniciarAtendimentoHumano(telefone, conversationId);
      if (!result.ok) alert(`Não deu certo: ${result.error}`);
    });
  }

  if (humano) {
    return (
      <button
        onClick={handleClick}
        disabled={pending}
        className="flex h-[34px] w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[999px] border border-[rgba(168,85,247,0.3)] bg-[rgba(168,85,247,0.1)] px-5 disabled:opacity-50 lg:w-auto"
      >
        <Undo2 size={17} className="text-[#d8b4fe]" />
        <span className="text-[14.5px] font-semibold text-[#d8b4fe]">{pending ? "Devolvendo..." : "Devolver ao bot"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="flex h-[34px] w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[999px] px-5 text-white shadow-[0px_14px_32px_-14px_rgba(168,85,247,0.5)] disabled:opacity-50 lg:w-auto"
      style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
    >
      <UserRound size={17} />
      <span className="text-[14.5px] font-semibold">{pending ? "Iniciando..." : "Iniciar Atendimento Humano"}</span>
    </button>
  );
}
