"use client";

import { useState, useTransition } from "react";
import { FileText, Star } from "lucide-react";
import { alternarFavoritoModelo } from "@/lib/data/modelos-mensagem-actions";
import type { ModeloMensagem } from "@/lib/data/modelos-mensagem";

/** Mesmos tokens que `modelo-mensagem-dialog.tsx` deixa inserir na criação. */
function aplicarTokens(conteudo: string, nomeAtendente: string): string {
  return conteudo.replaceAll("{{atendente}}", nomeAtendente);
}

export function ModelosMensagemPopover({
  modelos,
  nomeAtendente,
  onSelecionar,
  abrirPara = "cima",
}: {
  modelos: ModeloMensagem[];
  nomeAtendente: string;
  onSelecionar: (texto: string) => void;
  /** "cima" pro composer (fica embaixo da tela); "baixo" pra dentro de um dialog. */
  abrirPara?: "cima" | "baixo";
}) {
  const [open, setOpen] = useState(false);
  // espelho local só pra reagir na hora ao clique na estrela — a ordem
  // (favoritos primeiro) só se ajusta de verdade no próximo carregamento,
  // pra não a lista pular embaixo do dedo de quem tá clicando.
  const [favoritos, setFavoritos] = useState<Set<number>>(() => new Set(modelos.filter((m) => m.favorito).map((m) => m.id)));
  const [, startTransition] = useTransition();

  function alternar(modeloId: number) {
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
        // reverte se falhar
        setFavoritos((atual) => {
          const novo = new Set(atual);
          if (favoritarAgora) novo.delete(modeloId);
          else novo.add(modeloId);
          return novo;
        });
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Modelos de mensagem"
        aria-label="Modelos de mensagem"
        className="flex size-[22px] items-center justify-center rounded-[6px] text-[var(--color-text-muted)] hover:bg-white/[0.06] hover:text-[var(--color-text-secondary)]"
      >
        <FileText size={13} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute left-0 z-50 w-[300px] overflow-hidden rounded-[14px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-1.5 shadow-xl ${
              abrirPara === "cima" ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            <p className="px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.4px] text-[var(--color-text-muted)] uppercase">
              Modelos de mensagem
            </p>
            {modelos.length === 0 ? (
              <p className="px-2.5 py-3 text-[12px] leading-[1.6] text-[var(--color-text-muted)]">
                Nenhum modelo cadastrado ainda. Crie clicando no ícone de modelos, ao lado do{" "}
                <span className="font-medium text-[var(--color-text-secondary)]">+</span> em Conversas.
              </p>
            ) : (
              <div className="flex max-h-[280px] flex-col overflow-y-auto">
                {modelos.map((m) => {
                  const favoritado = favoritos.has(m.id);
                  return (
                    <div key={m.id} className="flex items-start gap-1 rounded-[10px] px-1 hover:bg-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => alternar(m.id)}
                        title={favoritado ? "Tirar dos favoritos" : "Favoritar"}
                        className="mt-2 flex size-[22px] shrink-0 items-center justify-center rounded-[7px] text-[var(--color-text-muted)] hover:bg-white/[0.08]"
                      >
                        <Star
                          size={13}
                          className={favoritado ? "fill-[#a855f7] text-[#a855f7]" : ""}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelecionar(aplicarTokens(m.conteudo ?? "", nomeAtendente));
                          setOpen(false);
                        }}
                        className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-[10px] py-2 pr-2 text-left"
                      >
                        <span className="text-[12.5px] font-medium text-[var(--color-text-primary)]">{m.nome}</span>
                        <span className="truncate text-[11px] text-[var(--color-text-muted)]">
                          {aplicarTokens(m.conteudo ?? "", nomeAtendente)}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
