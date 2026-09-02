"use client";

import { useRef, useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { atualizarCapacidadeTotal, atualizarCapacidadeTotalEmLote } from "@/lib/data/capacidade-actions";

export function CapacidadeTotalInput({
  id,
  valorInicial,
  data,
  todosIds,
}: {
  id: number;
  valorInicial: number;
  data: string;
  todosIds: number[];
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(valorInicial);
  const [texto, setTexto] = useState(String(valorInicial));
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();
  const valorAnterior = useRef(valorInicial);

  const outrosDias = todosIds.length - 1;
  const dataFormatada = new Date(data + "T00:00:00").toLocaleDateString("pt-BR");

  function abrirEdicao() {
    setTexto(String(valor));
    setEditando(true);
  }

  function commit() {
    setEditando(false);
    const novoValor = texto === "" ? 0 : Number(texto);
    setValor(novoValor);
    if (novoValor === valorAnterior.current) return;
    if (outrosDias > 0) {
      setConfirmando(true);
      return;
    }
    salvar(false, novoValor);
  }

  function cancelarConfirmacao() {
    setConfirmando(false);
    setValor(valorAnterior.current);
  }

  function salvar(emLote: boolean, novoValor: number = valor) {
    setConfirmando(false);
    startTransition(async () => {
      const result = emLote
        ? await atualizarCapacidadeTotalEmLote(todosIds, novoValor)
        : await atualizarCapacidadeTotal(id, novoValor);
      if (!result.ok) {
        alert(`Não deu pra salvar: ${result.error}`);
        setValor(valorAnterior.current);
      } else {
        valorAnterior.current = novoValor;
      }
    });
  }

  return (
    <>
      {editando ? (
        <input
          type="number"
          min={0}
          autoFocus
          value={texto}
          disabled={pending}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="h-[28px] w-[70px] rounded-[999px] border border-[rgba(168,85,247,0.3)] bg-transparent text-center text-[13px] font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(168,85,247,0.5)] disabled:opacity-50"
        />
      ) : (
        <button
          type="button"
          onClick={abrirEdicao}
          title="Alterar capacidade total do dia"
          disabled={pending}
          className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
        >
          {valor}
          <Pencil size={12} className="text-[var(--color-text-muted)]" />
        </button>
      )}

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={cancelarConfirmacao}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-[380px] flex-col gap-6 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-7"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[16px] font-semibold text-[var(--color-text-primary)]">Alterar capacidade total</h2>
              <button onClick={cancelarConfirmacao} className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <p className="text-[13.5px] leading-[1.7] text-[var(--color-text-secondary)]">
              Mudar a capacidade de <span className="font-semibold text-[var(--color-text-primary)]">{dataFormatada}</span> pra{" "}
              <span className="font-semibold text-[var(--color-text-primary)]">{valor}</span>. Aplicar só nesse dia, ou nos outros{" "}
              {outrosDias} dias listados também?
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => salvar(true)}
                disabled={pending}
                className="h-9 rounded-[999px] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
                style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
              >
                {pending ? "Aplicando..." : `Aplicar a todos os ${todosIds.length} dias listados`}
              </button>
              <button
                type="button"
                onClick={() => salvar(false)}
                disabled={pending}
                className="h-9 rounded-[999px] border border-white/[0.14] px-5 text-[13px] font-medium text-[var(--color-text-secondary)] disabled:opacity-60"
              >
                Só esse dia
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
