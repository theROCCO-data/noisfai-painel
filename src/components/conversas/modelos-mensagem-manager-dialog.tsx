"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, X, Pencil, Trash2, Plus, UserRound, Star } from "lucide-react";
import {
  criarModeloMensagem,
  editarModeloMensagem,
  excluirModeloMensagem,
  alternarFavoritoModelo,
} from "@/lib/data/modelos-mensagem-actions";
import { useEscapeClose } from "@/hooks/use-escape-close";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/lib/toast";
import type { ModeloMensagem } from "@/lib/data/modelos-mensagem";

const TOKENS = [{ token: "{{atendente}}", label: "Nome do atendente" }];

export function ModelosMensagemManagerDialog({ modelos }: { modelos: ModeloMensagem[] }) {
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<ModeloMensagem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [favoritos, setFavoritos] = useState<Set<number>>(() => new Set(modelos.filter((m) => m.favorito).map((m) => m.id)));
  const [excluindo, setExcluindo] = useState<ModeloMensagem | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function alternarFavorito(modeloId: number) {
    const favoritarAgora = !favoritos.has(modeloId);
    setFavoritos((atual) => {
      const novo = new Set(atual);
      if (favoritarAgora) novo.add(modeloId);
      else novo.delete(modeloId);
      return novo;
    });
    startTransition(async () => {
      const result = await alternarFavoritoModelo(modeloId, favoritarAgora);
      if (!result.ok) {
        setFavoritos((atual) => {
          const novo = new Set(atual);
          if (favoritarAgora) novo.delete(modeloId);
          else novo.add(modeloId);
          return novo;
        });
      }
    });
  }

  function novoModelo() {
    setEditando(null);
    setError(null);
    formRef.current?.reset();
  }

  function inserirToken(token: string) {
    const el = textareaRef.current;
    if (!el) return;
    const inicio = el.selectionStart ?? el.value.length;
    const fim = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, inicio) + token + el.value.slice(fim);
    el.focus();
    el.selectionStart = el.selectionEnd = inicio + token.length;
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = editando ? await editarModeloMensagem(editando.id, formData) : await criarModeloMensagem(formData);
      if (result.ok) {
        toast(editando ? "Modelo atualizado." : "Modelo criado.");
        novoModelo();
      } else {
        setError(result.error);
      }
    });
  }

  function confirmarExcluir() {
    if (!excluindo) return;
    const m = excluindo;
    startTransition(async () => {
      const result = await excluirModeloMensagem(m.id);
      setExcluindo(null);
      if (!result.ok) {
        setError(result.error);
      } else {
        toast("Modelo excluído.");
        if (editando?.id === m.id) novoModelo();
      }
    });
  }

  function fechar() {
    setOpen(false);
    novoModelo();
  }

  useEscapeClose(open, fechar);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Modelos de mensagem"
        aria-label="Modelos de mensagem"
        className="flex size-[28px] shrink-0 items-center justify-center rounded-[10px] border border-[var(--color-border-soft)] text-[var(--color-text-secondary)] hover:border-[rgba(168,85,247,0.4)] hover:text-[var(--color-accent)]"
      >
        <FileText size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={fechar}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[600px] w-[820px] max-w-full flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[18px] font-semibold text-[var(--color-text-primary)]">Modelos de mensagem</h2>
              <button onClick={fechar} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-2 gap-6">
              {/* Criar / editar */}
              <div className="flex min-h-0 flex-col gap-3">
                <p className="text-[11px] font-semibold tracking-[0.5px] text-[var(--color-text-muted)] uppercase">
                  {editando ? `Editando "${editando.nome}"` : "Criar novo modelo"}
                </p>
                <form ref={formRef} action={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[12px] text-[var(--color-text-muted)]">Nome do modelo</span>
                    <input
                      name="nome"
                      key={editando?.id ?? "novo"}
                      defaultValue={editando?.nome}
                      required
                      placeholder="Ex: Confirmação de horário"
                      className="dialog-input"
                    />
                  </label>
                  <label className="flex min-h-0 flex-1 flex-col gap-1">
                    <span className="text-[12px] text-[var(--color-text-muted)]">Texto</span>
                    <textarea
                      ref={textareaRef}
                      name="conteudo"
                      key={`${editando?.id ?? "novo"}-conteudo`}
                      defaultValue={editando?.conteudo ?? ""}
                      required
                      className="dialog-input h-full min-h-[140px] resize-none py-2"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-[var(--color-text-muted)]">Inserir:</span>
                    {TOKENS.map((t) => (
                      <button
                        key={t.token}
                        type="button"
                        onClick={() => inserirToken(t.token)}
                        className="flex items-center gap-1 rounded-[999px] border border-[var(--color-border-soft)] px-[10px] py-[3px] text-[11.5px] text-[var(--color-text-secondary)] hover:border-[rgba(168,85,247,0.4)] hover:text-[var(--color-accent)]"
                      >
                        <UserRound size={11} />
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {error && <p className="text-[12.5px] text-[var(--color-status-red)]">{error}</p>}

                  <div className="mt-1 flex items-center gap-3">
                    {editando && (
                      <button
                        type="button"
                        onClick={novoModelo}
                        className="h-9 rounded-[999px] border border-white/[0.14] px-5 text-[13px] font-medium text-[var(--color-text-secondary)]"
                      >
                        Cancelar edição
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={pending}
                      className="h-9 rounded-[999px] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
                      style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
                    >
                      {pending ? "Salvando..." : editando ? "Salvar alterações" : "Criar modelo"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Existentes */}
              <div className="flex min-h-0 flex-col gap-3 border-l border-white/5 pl-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold tracking-[0.5px] text-[var(--color-text-muted)] uppercase">
                    Modelos existentes ({modelos.length})
                  </p>
                  <button
                    type="button"
                    onClick={novoModelo}
                    className="flex items-center gap-1 text-[11.5px] font-medium text-[var(--color-accent)] hover:underline"
                  >
                    <Plus size={12} />
                    Novo
                  </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                  {modelos.length === 0 ? (
                    <p className="py-8 text-center text-[12.5px] text-[var(--color-text-muted)]">
                      Nenhum modelo cadastrado ainda. Crie o primeiro ao lado.
                    </p>
                  ) : (
                    modelos.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col gap-1 rounded-[12px] border px-3 py-2.5 ${
                          editando?.id === m.id
                            ? "border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.08)]"
                            : "border-white/5 bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{m.nome}</p>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => alternarFavorito(m.id)}
                              title={favoritos.has(m.id) ? "Tirar dos favoritos" : "Favoritar"}
                              aria-label={favoritos.has(m.id) ? "Tirar dos favoritos" : "Favoritar"}
                              className="flex size-[24px] items-center justify-center rounded-[7px] text-[var(--color-text-muted)] hover:bg-white/[0.06]"
                            >
                              <Star size={12} className={favoritos.has(m.id) ? "fill-[#a855f7] text-[#a855f7]" : ""} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditando(m);
                                setError(null);
                              }}
                              title="Editar"
                              aria-label={`Editar modelo ${m.nome}`}
                              className="flex size-[24px] items-center justify-center rounded-[7px] text-[var(--color-text-muted)] hover:bg-white/[0.06] hover:text-[var(--color-text-secondary)]"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExcluindo(m)}
                              title="Excluir"
                              aria-label={`Excluir modelo ${m.nome}`}
                              className="flex size-[24px] items-center justify-center rounded-[7px] text-[var(--color-text-muted)] hover:bg-[rgba(248,113,113,0.12)] hover:text-[var(--color-status-red)]"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <p className="text-[12px] text-[var(--color-text-muted)]">{m.conteudo}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!excluindo}
        titulo="Excluir modelo"
        mensagem={excluindo ? `Excluir o modelo "${excluindo.nome}"?` : ""}
        confirmarLabel="Excluir"
        pending={pending}
        onConfirmar={confirmarExcluir}
        onCancelar={() => setExcluindo(null)}
      />
    </>
  );
}
