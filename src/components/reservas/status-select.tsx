"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { atualizarStatusReserva } from "@/lib/data/reservas-actions";
import { StatusBadge } from "@/components/ui/status-badge";

const OPCOES = [
  { value: "confirmada", label: "Confirmado" },
  { value: "pendente", label: "Pendente" },
  { value: "compareceu", label: "Compareceu" },
  { value: "nao_compareceu", label: "Não compareceu" },
];

export function StatusSelect({ reservaId, status }: { reservaId: number; status: string }) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(status);
  const [pending, startTransition] = useTransition();
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [montado, setMontado] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!open) return;
    function fechar(e: MouseEvent) {
      const alvo = e.target as Node;
      if (triggerRef.current?.contains(alvo) || menuRef.current?.contains(alvo)) return;
      setOpen(false);
    }
    // fecha também se rolar a página — o menu é posicionado fixo (fora da
    // tabela, num portal), então não acompanha o scroll do gatilho
    function fecharNoScroll() {
      setOpen(false);
    }
    document.addEventListener("click", fechar);
    window.addEventListener("scroll", fecharNoScroll, true);
    return () => {
      document.removeEventListener("click", fechar);
      window.removeEventListener("scroll", fecharNoScroll, true);
    };
  }, [open]);

  // cancelado não tem menu — o cancelamento tem fluxo próprio (botão de cancelar)
  if (valor === "cancelado") {
    return <StatusBadge status={valor} />;
  }

  function abrir() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 6, left: rect.left });
    setOpen((o) => !o);
  }

  function escolher(novoStatus: string) {
    setOpen(false);
    if (novoStatus === valor) return;
    const anterior = valor;
    setValor(novoStatus);
    startTransition(async () => {
      const result = await atualizarStatusReserva(reservaId, novoStatus);
      if (!result.ok) setValor(anterior);
    });
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={abrir}
        disabled={pending}
        className="flex items-center gap-1 disabled:opacity-60"
      >
        <StatusBadge status={valor} />
        <ChevronDown size={12} className="text-[var(--color-text-muted)]" />
      </button>

      {open &&
        montado &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: pos.top, left: pos.left }}
            className="z-[100] w-[170px] overflow-hidden rounded-[10px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-1 shadow-xl"
          >
            {OPCOES.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => escolher(o.value)}
                className="flex w-full items-center rounded-[8px] px-3 py-2 text-left text-[13px] text-[var(--color-text-primary)] hover:bg-white/[0.06]"
              >
                {o.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
