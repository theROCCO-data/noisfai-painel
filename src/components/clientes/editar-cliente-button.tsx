"use client";

import { Pencil } from "lucide-react";
import { EditarClienteDialog } from "@/components/clientes/editar-cliente-dialog";
import type { Cliente } from "@/lib/data/clientes";

/**
 * A linha inteira do cliente é um <Link> pra "Ver detalhes" — esse wrapper
 * intercepta o clique antes dele borbulhar pro Link, senão o clique no
 * ícone também navegaria pra página do cliente (mesmo padrão de
 * `iniciar-conversa-button.tsx`).
 */
export function EditarClienteButton({ cliente }: { cliente: Cliente }) {
  return (
    <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <EditarClienteDialog
        cliente={cliente}
        trigger={
          <span
            title="Editar cliente"
            aria-label="Editar cliente"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-border-soft)] text-[var(--color-text-secondary)] hover:border-[rgba(168,85,247,0.4)] hover:text-[var(--color-accent)]"
          >
            <Pencil size={13} />
          </span>
        }
      />
    </span>
  );
}
