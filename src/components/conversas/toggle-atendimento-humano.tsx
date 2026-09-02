"use client";

import { useTransition } from "react";
import { Undo2, UserRound, CircleCheck } from "lucide-react";
import { iniciarAtendimentoHumano, finalizarAtendimentoHumano } from "@/lib/data/status-humano-actions";
import type { StatusAtendimento } from "@/lib/data/status-humano";

export function ToggleAtendimentoHumano({
  telefone,
  conversationId,
  status,
}: {
  telefone: string;
  conversationId: string;
  status: StatusAtendimento;
}) {
  const [pending, startTransition] = useTransition();

  function assumir() {
    startTransition(async () => {
      const result = await iniciarAtendimentoHumano(telefone, conversationId);
      if (!result.ok) alert(`Não deu certo: ${result.error}`);
    });
  }

  function devolverOuResolver() {
    startTransition(async () => {
      const result = await finalizarAtendimentoHumano(telefone, conversationId);
      if (!result.ok) alert(`Não deu certo: ${result.error}`);
    });
  }

  if (status === "atencao") {
    return (
      <div className="flex w-full shrink-0 flex-col gap-2 lg:w-auto lg:flex-row">
        <button
          onClick={assumir}
          disabled={pending}
          className="flex h-[34px] w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[999px] px-5 text-white shadow-[0px_14px_32px_-14px_rgba(168,85,247,0.5)] disabled:opacity-50 lg:w-auto"
          style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
        >
          <UserRound size={17} />
          <span className="text-[14.5px] font-semibold">{pending ? "Assumindo..." : "Assumir atendimento"}</span>
        </button>
        <button
          onClick={devolverOuResolver}
          disabled={pending}
          className="flex h-[34px] w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[999px] border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] px-5 disabled:opacity-50 lg:w-auto"
        >
          <CircleCheck size={17} className="text-[var(--color-status-green)]" />
          <span className="text-[14.5px] font-semibold text-[var(--color-status-green)]">
            {pending ? "Marcando..." : "Marcar como resolvido"}
          </span>
        </button>
      </div>
    );
  }

  if (status === "humano") {
    return (
      <button
        onClick={devolverOuResolver}
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
      onClick={assumir}
      disabled={pending}
      className="flex h-[34px] w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[999px] px-5 text-white shadow-[0px_14px_32px_-14px_rgba(168,85,247,0.5)] disabled:opacity-50 lg:w-auto"
      style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
    >
      <UserRound size={17} />
      <span className="text-[14.5px] font-semibold">{pending ? "Iniciando..." : "Iniciar Atendimento Humano"}</span>
    </button>
  );
}
