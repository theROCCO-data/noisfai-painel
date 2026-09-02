"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { salvarItemIfood, excluirItemIfood } from "@/lib/data/ifood-actions";
import { Toggle } from "@/components/ui/toggle";
import { CategoriaField } from "@/components/ui/categoria-field";
import type { ItemIfood } from "@/lib/data/ifood";

export function ItemIfoodDialog({
  item,
  trigger,
  categorias,
}: {
  item?: ItemIfood;
  trigger: React.ReactNode;
  categorias: string[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await salvarItemIfood({
        id: item?.id,
        categoria: String(formData.get("categoria") ?? ""),
        nome: String(formData.get("nome") ?? ""),
        descricao: String(formData.get("descricao") ?? ""),
        preco: Number(formData.get("preco") ?? 0),
        disponivel: formData.get("disponivel") === "on",
      });
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  function handleDelete() {
    if (!item || !confirm(`Excluir "${item.nome}"?`)) return;
    startTransition(async () => {
      const result = await excluirItemIfood(item.id);
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)}>{trigger}</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex w-[460px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
                {item ? "Editar item iFood" : "Novo item iFood"}
              </h2>
              <button onClick={() => setOpen(false)} className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Nome do item</span>
                <input name="nome" defaultValue={item?.nome} required className="dialog-input" />
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <CategoriaField categorias={categorias} defaultValue={item?.categoria} />
                </div>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">Preço no iFood (R$)</span>
                  <input name="preco" type="number" step="0.01" min={0} defaultValue={item?.preco} required className="dialog-input" />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-muted)]">Descrição</span>
                <textarea name="descricao" defaultValue={item?.descricao ?? ""} rows={5} className="dialog-input h-auto resize-y py-2" />
              </label>
              <Toggle name="disponivel" defaultChecked={item?.disponivel ?? true} label="Disponível para pedido" />

              {error && <p className="text-[12.5px] text-[var(--color-status-red)]">{error}</p>}

              <div className="mt-2 flex items-center justify-between">
                {item ? (
                  <button type="button" onClick={handleDelete} className="text-[13px] font-medium text-[var(--color-status-red)]">
                    Excluir item
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
                    {pending ? "Salvando..." : item ? "Salvar" : "Adicionar item"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
