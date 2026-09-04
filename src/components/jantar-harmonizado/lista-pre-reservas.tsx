import { StatusBadge } from "@/components/ui/status-badge";
import { TabelaRedimensionavel, Coluna } from "@/components/ui/tabela-redimensionavel";
import { ConfirmarPagamentoButton } from "@/components/jantar-harmonizado/confirmar-pagamento-button";
import { EditarReservaJHDialog } from "@/components/jantar-harmonizado/editar-reserva-jh-dialog";
import type { PreReservaJH } from "@/lib/data/jantar-harmonizado";

function formatData(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}
function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ListaPreReservas({
  tableId,
  itens,
  vazio,
  mostrarConfirmar,
  valorPessoa,
}: {
  tableId: string;
  itens: PreReservaJH[];
  vazio: string;
  mostrarConfirmar: boolean;
  /** Valor por pessoa da edição atual — multiplica por `pessoas` pra mostrar o valor esperado de cada reserva. */
  valorPessoa: number;
}) {
  return (
    <>
      {/* Mobile: lista de cartões — a tabela de colunas fixas não cabe numa tela pequena */}
      <div className="flex w-full flex-col gap-3 lg:hidden">
        {itens.length === 0 ? (
          <p className="px-[18px] py-8 text-center text-[13px] text-[var(--color-text-muted)]">{vazio}</p>
        ) : (
          itens.map((p) => (
            <div key={p.id} className="flex w-full flex-col gap-3 rounded-[16px] border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">{p.nome}</p>
                  <p className="text-[12px] text-[var(--color-text-muted)]">
                    {p.pessoas} pessoa{p.pessoas === 1 ? "" : "s"} · {formatData(p.data)} · {formatBRL(p.pessoas * valorPessoa)}
                  </p>
                </div>
                <span
                  className={`flex h-[20px] shrink-0 items-center rounded-[999px] px-[8px] text-[10.5px] font-medium ${
                    p.canal === "presencial"
                      ? "bg-[rgba(125,211,252,0.13)] text-[var(--color-status-sky)]"
                      : "bg-[rgba(168,85,247,0.13)] text-[#c4b5fd]"
                  }`}
                >
                  {p.canal === "presencial" ? "Presencial" : "Online"}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
                <StatusBadge status={p.statusPagamento} />
                {p.comprovanteUrl ? (
                  <a href={p.comprovanteUrl} target="_blank" rel="noreferrer" className="text-[12.5px] font-medium text-[#d8b4fe] hover:underline">
                    Ver comprovante
                  </a>
                ) : (
                  <span className="text-[12.5px] text-[var(--color-text-muted)]">Sem comprovante</span>
                )}
                <div className="flex items-center gap-1">
                  {mostrarConfirmar && p.comprovanteUrl && <ConfirmarPagamentoButton reservaId={p.id} />}
                  <EditarReservaJHDialog reserva={p} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: tabela com colunas redimensionáveis */}
      <div className="hidden w-full lg:block">
        <TabelaRedimensionavel tableId={tableId}>
          <div className="flex w-full items-center gap-3 px-[18px] py-[9px] text-[12px] font-medium text-[var(--color-text-muted)]">
            <Coluna id="cliente" defaultWidth={220} header>Cliente</Coluna>
            <Coluna id="pessoas" defaultWidth={80} header>Pessoas</Coluna>
            <Coluna id="valor" defaultWidth={100} header>Valor</Coluna>
            <Coluna id="data" defaultWidth={100} header>Data</Coluna>
            <Coluna id="canal" defaultWidth={90} header>Canal</Coluna>
            <Coluna id="pagamento" defaultWidth={130} header>Pagamento</Coluna>
            <Coluna id="comprovante" defaultWidth={160} header>Comprovante</Coluna>
            <Coluna id="acoes" defaultWidth={170} header>Ações</Coluna>
          </div>
          {itens.length === 0 ? (
            <p className="px-[18px] py-8 text-center text-[13px] text-[var(--color-text-muted)]">{vazio}</p>
          ) : (
            itens.map((p) => (
              <div key={p.id} className="flex w-full items-center gap-3 border-t border-white/5 px-[18px] py-3 text-[13px]">
                <Coluna id="cliente" defaultWidth={220} className="text-[var(--color-text-primary)]">
                  {p.nome}
                </Coluna>
                <Coluna id="pessoas" defaultWidth={80} className="text-[var(--color-text-secondary)]">
                  {p.pessoas}
                </Coluna>
                <Coluna id="valor" defaultWidth={100} className="font-medium text-[var(--color-text-primary)]">
                  {formatBRL(p.pessoas * valorPessoa)}
                </Coluna>
                <Coluna id="data" defaultWidth={100} className="text-[var(--color-text-secondary)]">
                  {formatData(p.data)}
                </Coluna>
                <Coluna id="canal" defaultWidth={90}>
                  <span
                    className={`flex h-[20px] w-fit items-center rounded-[999px] px-[8px] text-[10.5px] font-medium ${
                      p.canal === "presencial"
                        ? "bg-[rgba(125,211,252,0.13)] text-[var(--color-status-sky)]"
                        : "bg-[rgba(168,85,247,0.13)] text-[#c4b5fd]"
                    }`}
                  >
                    {p.canal === "presencial" ? "Presencial" : "Online"}
                  </span>
                </Coluna>
                <Coluna id="pagamento" defaultWidth={130}>
                  <StatusBadge status={p.statusPagamento} />
                </Coluna>
                <Coluna id="comprovante" defaultWidth={160}>
                  {p.comprovanteUrl ? (
                    <a href={p.comprovanteUrl} target="_blank" rel="noreferrer" className="font-medium text-[#d8b4fe] hover:underline">
                      Ver comprovante
                    </a>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">—</span>
                  )}
                </Coluna>
                <Coluna id="acoes" defaultWidth={170} className="flex items-center gap-1">
                  {mostrarConfirmar && p.comprovanteUrl && <ConfirmarPagamentoButton reservaId={p.id} />}
                  <EditarReservaJHDialog reserva={p} />
                </Coluna>
              </div>
            ))
          )}
        </TabelaRedimensionavel>
      </div>
    </>
  );
}
