"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, X, Search, Minus } from "lucide-react";
import { buscarClientesPorNome, type ClienteBusca } from "@/lib/data/clientes-actions";
import { criarAtendimentoPresencial } from "@/lib/data/atendimento-presencial-actions";
import type { ItemCardapio } from "@/lib/data/cardapio";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function NovoAtendimentoDialog({ itensCardapio }: { itensCardapio: ItemCardapio[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ClienteBusca[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteBusca | null>(null);
  const [buscando, setBuscando] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [observacao, setObservacao] = useState("");
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});

  const categorias = useMemo(() => {
    const grupos = new Map<string, ItemCardapio[]>();
    for (const item of itensCardapio) {
      if (!grupos.has(item.categoria)) grupos.set(item.categoria, []);
      grupos.get(item.categoria)!.push(item);
    }
    return Array.from(grupos.entries());
  }, [itensCardapio]);

  const itensSelecionados = itensCardapio.filter((i) => (quantidades[i.id] ?? 0) > 0);
  const total = itensSelecionados.reduce((acc, i) => acc + i.preco * (quantidades[i.id] ?? 0), 0);

  async function onBuscarChange(v: string) {
    setBusca(v);
    setClienteSelecionado(null);
    if (v.trim().length < 2) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const r = await buscarClientesPorNome(v);
    setResultados(r);
    setBuscando(false);
  }

  function selecionarCliente(c: ClienteBusca) {
    setClienteSelecionado(c);
    setBusca(c.nome);
    setResultados([]);
    setNome(c.nome);
    setTelefone(c.telefone);
    setEmail(c.email ?? "");
  }

  function ajustarQuantidade(id: number, delta: number) {
    setQuantidades((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + delta) }));
  }

  function fechar() {
    setOpen(false);
    setError(null);
    setBusca("");
    setResultados([]);
    setClienteSelecionado(null);
    setNome("");
    setTelefone("");
    setEmail("");
    setObservacao("");
    setQuantidades({});
  }

  function confirmar() {
    setError(null);
    const nomeFinal = clienteSelecionado?.nome ?? nome;
    if (!nomeFinal.trim()) {
      setError("Informe o nome do cliente.");
      return;
    }
    if (itensSelecionados.length === 0) {
      setError("Adicione pelo menos um item ao pedido.");
      return;
    }
    startTransition(async () => {
      const result = await criarAtendimentoPresencial({
        clienteId: clienteSelecionado?.id ?? null,
        nome: nomeFinal,
        telefone,
        email,
        observacao,
        itens: itensSelecionados.map((i) => ({
          cardapioItemId: i.id,
          nome: i.nome,
          preco: i.preco,
          quantidade: quantidades[i.id] ?? 0,
        })),
      });
      if (result.ok) fechar();
      else setError(result.error);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-[34px] shrink-0 items-center gap-2 rounded-[999px] px-5 shadow-[0px_14px_32px_-14px_rgba(168,85,247,0.5)]"
        style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
      >
        <Plus size={15} className="text-white" />
        <span className="text-[13px] font-semibold text-white">Novo atendimento</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={fechar}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[86vh] w-[520px] flex-col gap-4 overflow-y-auto rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">Novo atendimento presencial</h2>
              <button onClick={fechar} className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold tracking-[0.5px] text-[var(--color-text-muted)] uppercase">Cliente</p>
              <div className="relative">
                <div className="flex h-[38px] w-full items-center gap-2 rounded-[10px] border border-[var(--color-border-soft)] bg-white/[0.03] px-3">
                  <Search size={14} className="text-[var(--color-text-muted)]" />
                  <input
                    value={busca}
                    onChange={(e) => onBuscarChange(e.target.value)}
                    placeholder="Buscar cliente pelo nome, ou digitar um novo"
                    className="w-full bg-transparent text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                  />
                </div>
                {busca.length >= 2 && !clienteSelecionado && (resultados.length > 0 || buscando) && (
                  <div className="absolute left-0 right-0 z-10 mt-1 overflow-hidden rounded-[10px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] shadow-xl">
                    {buscando ? (
                      <p className="px-3 py-2.5 text-[12.5px] text-[var(--color-text-muted)]">Buscando...</p>
                    ) : (
                      resultados.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selecionarCliente(c)}
                          className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-white/[0.06]"
                        >
                          <span className="text-[13px] text-[var(--color-text-primary)]">{c.nome}</span>
                          <span className="text-[11px] text-[var(--color-text-muted)]">{c.telefone}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {!clienteSelecionado && (
                <div className="flex flex-col gap-3 rounded-[12px] border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-[11.5px] text-[var(--color-text-muted)]">
                    Cliente não encontrado? Preencha os dados pra cadastrar um novo.
                  </p>
                  <label className="flex flex-col gap-1">
                    <span className="text-[12px] text-[var(--color-text-muted)]">Nome</span>
                    <input value={nome} onChange={(e) => setNome(e.target.value)} className="dialog-input" />
                  </label>
                  <div className="flex gap-3">
                    <label className="flex flex-1 flex-col gap-1">
                      <span className="text-[12px] text-[var(--color-text-muted)]">Telefone (opcional)</span>
                      <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="dialog-input" />
                    </label>
                    <label className="flex flex-1 flex-col gap-1">
                      <span className="text-[12px] text-[var(--color-text-muted)]">E-mail (opcional)</span>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} className="dialog-input" />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold tracking-[0.5px] text-[var(--color-text-muted)] uppercase">Itens do pedido</p>
              {categorias.length === 0 ? (
                <p className="text-[12.5px] text-[var(--color-text-muted)]">Nenhum item disponível no cardápio presencial.</p>
              ) : (
                <div className="flex max-h-[280px] flex-col gap-4 overflow-y-auto pr-1">
                  {categorias.map(([categoria, itens]) => (
                    <div key={categoria} className="flex flex-col gap-1.5">
                      <p className="text-[11.5px] font-medium text-[var(--color-text-secondary)]">{categoria}</p>
                      {itens.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-2 rounded-[10px] px-2 py-1.5 hover:bg-white/[0.03]">
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-[13px] text-[var(--color-text-primary)]">{item.nome}</span>
                            <span className="text-[11px] text-[var(--color-text-muted)]">{formatBRL(item.preco)}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => ajustarQuantidade(item.id, -1)}
                              className="flex size-[24px] items-center justify-center rounded-[8px] border border-white/10 text-[var(--color-text-secondary)]"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-5 text-center text-[13px] text-[var(--color-text-primary)]">{quantidades[item.id] ?? 0}</span>
                            <button
                              type="button"
                              onClick={() => ajustarQuantidade(item.id, 1)}
                              className="flex size-[24px] items-center justify-center rounded-[8px] border border-white/10 text-[var(--color-text-secondary)]"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[12px] text-[var(--color-text-muted)]">Observação (opcional)</span>
              <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} className="dialog-input h-auto resize-y py-2" />
            </label>

            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-[12.5px] text-[var(--color-text-muted)]">Total</span>
              <span className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">{formatBRL(total)}</span>
            </div>

            {error && <p className="text-[12.5px] text-[var(--color-status-red)]">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={fechar}
                className="h-9 rounded-[999px] border border-white/[0.14] px-5 text-[13px] font-medium text-[var(--color-text-secondary)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={pending}
                className="h-9 rounded-[999px] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
                style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
              >
                {pending ? "Salvando..." : "Registrar atendimento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
