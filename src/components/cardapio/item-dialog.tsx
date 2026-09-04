"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { salvarItemCardapio, excluirItemCardapio } from "@/lib/data/cardapio-actions";
import { toast } from "@/lib/toast";
import { Toggle } from "@/components/ui/toggle";
import { CategoriaField } from "@/components/ui/categoria-field";
import { useEscapeClose } from "@/hooks/use-escape-close";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ItemCardapio } from "@/lib/data/cardapio";

export function ItemDialog({
  item,
  trigger,
  categorias,
}: {
  item?: ItemCardapio;
  trigger: React.ReactNode;
  categorias: string[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [pending, startTransition] = useTransition();
  const [disponivelIfood, setDisponivelIfood] = useState(item?.disponivelIfood ?? false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const precoIfoodStr = String(formData.get("precoIfood") ?? "");
      const result = await salvarItemCardapio({
        id: item?.id,
        categoria: String(formData.get("categoria") ?? ""),
        nome: String(formData.get("nome") ?? ""),
        descricao: String(formData.get("descricao") ?? ""),
        preco: Number(formData.get("preco") ?? 0),
        precoIfood: precoIfoodStr === "" ? null : Number(precoIfoodStr),
        disponivelPresencial: formData.get("disponivelPresencial") === "on",
        disponivelIfood: formData.get("disponivelIfood") === "on",
      });
      if (result.ok) {
        setOpen(false);
        toast(item ? "Prato salvo." : "Prato adicionado.");
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!item) return;
    startTransition(async () => {
      const result = await excluirItemCardapio(item.id);
      setConfirmandoExclusao(false);
      if (result.ok) {
        setOpen(false);
        toast("Prato excluído.");
      } else {
        setError(result.error);
      }
    });
  }

  useEscapeClose(open, () => setOpen(false));

  return (
    <>
      <button onClick={() => setOpen(true)}>{trigger}</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex w-[460px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
                {item ? "Editar prato" : "Novo prato"}
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Nome do prato</span>
                <input name="nome" defaultValue={item?.nome} required className="dialog-input" />
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <CategoriaField categorias={categorias} defaultValue={item?.categoria} />
                </div>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Preço (R$)</span>
                  <input name="preco" type="number" step="0.01" min={0} defaultValue={item?.preco} required className="dialog-input" />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Descrição</span>
                <textarea name="descricao" defaultValue={item?.descricao ?? ""} className="dialog-input h-auto min-h-[140px] overflow-y-auto py-2.5 leading-[1.6]" />
              </label>
              <Toggle name="disponivelPresencial" defaultChecked={item?.disponivelPresencial ?? true} label="Disponível no cardápio presencial" />
              <Toggle
                name="disponivelIfood"
                defaultChecked={item?.disponivelIfood ?? false}
                label="Disponível no iFood (delivery)"
                onChange={setDisponivelIfood}
              />
              {disponivelIfood && (
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Preço no iFood (se for diferente do presencial)</span>
                  <input
                    name="precoIfood"
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={item?.precoIfood ?? item?.preco}
                    className="dialog-input"
                  />
                </label>
              )}

              {error && <p className="text-[12.5px] text-[var(--color-status-red)]">{error}</p>}

              <div className="mt-2 flex items-center justify-between">
                {item ? (
                  <button
                    type="button"
                    onClick={() => setConfirmandoExclusao(true)}
                    className="text-[13px] font-medium text-[var(--color-status-red)]"
                  >
                    Excluir prato
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex gap-3">
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
                    {pending ? "Salvando..." : item ? "Salvar" : "Adicionar prato"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {item && (
        <ConfirmDialog
          open={confirmandoExclusao}
          titulo="Excluir prato"
          mensagem={`Excluir "${item.nome}"?`}
          confirmarLabel="Excluir"
          pending={pending}
          onConfirmar={handleDelete}
          onCancelar={() => setConfirmandoExclusao(false)}
        />
      )}
    </>
  );
}
