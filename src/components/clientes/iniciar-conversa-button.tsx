"use client";

import { MessageCircle } from "lucide-react";
import { NovaConversaDialog } from "@/components/conversas/nova-conversa-dialog";
import type { ModeloMensagem } from "@/lib/data/modelos-mensagem";

/**
 * A linha inteira do cliente é um <Link> pra "Ver detalhes" — esse wrapper
 * intercepta o clique antes dele borbulhar pro Link, senão o clique no
 * ícone também navegaria pra página do cliente.
 */
export function IniciarConversaButton({
  telefone,
  nome,
  modelos,
  nomeAtendente,
}: {
  telefone: string;
  nome: string;
  modelos: ModeloMensagem[];
  nomeAtendente: string;
}) {
  return (
    <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <NovaConversaDialog
        telefoneInicial={telefone}
        nomeInicial={nome}
        modelos={modelos}
        nomeAtendente={nomeAtendente}
        trigger={
          <span
            title="Iniciar conversa"
            aria-label="Iniciar conversa"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-border-soft)] text-[var(--color-text-secondary)] hover:border-[rgba(168,85,247,0.4)] hover:text-[var(--color-accent)]"
          >
            <MessageCircle size={14} />
          </span>
        }
      />
    </span>
  );
}
