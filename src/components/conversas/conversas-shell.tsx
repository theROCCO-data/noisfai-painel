"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * No desktop, lista e conversa sempre lado a lado (como já era). No mobile,
 * só cabe um dos dois por vez — alterna com base na rota: em /conversas
 * mostra a lista; em /conversas/[id] mostra só a thread (com botão de
 * voltar pra lista no cabeçalho da conversa).
 */
export function ConversasShell({ lista, children }: { lista: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const temConversaAberta = pathname !== "/conversas";

  return (
    <div className="flex h-full w-full gap-4">
      <div
        className={`${temConversaAberta ? "hidden lg:flex" : "flex"} h-full w-full flex-col overflow-y-auto rounded-[28px] lg:w-[340px] lg:shrink-0`}
      >
        {lista}
      </div>

      <div
        className={`${temConversaAberta ? "flex" : "hidden lg:flex"} h-full w-full flex-1 flex-col overflow-hidden rounded-[28px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[#0a0613]`}
      >
        {children}
      </div>
    </div>
  );
}
