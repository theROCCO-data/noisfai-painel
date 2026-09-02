import { Wine } from "lucide-react";
import { getEdicaoJH, getPreReservasJH } from "@/lib/data/jantar-harmonizado";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionCard } from "@/components/ui/section-card";
import { EditarEdicaoDialog } from "@/components/jantar-harmonizado/editar-edicao-dialog";
import { TabelaRedimensionavel, Coluna } from "@/components/ui/tabela-redimensionavel";

export const dynamic = "force-dynamic";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatData(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

export default async function JantarHarmonizadoPage() {
  const [edicao, preReservas] = await Promise.all([getEdicaoJH(), getPreReservasJH()]);
  const pendentes = preReservas.filter((p) => p.statusPagamento === "pendente").length;

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-[28px] font-semibold text-[var(--color-text-primary)]">Jantar Harmonizado</h1>

      {!edicao ? (
        <div className="w-full rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6 text-[13px] text-[var(--color-text-muted)]">
          Nenhuma edição de Jantar Harmonizado cadastrada em `eventos_especiais`.
        </div>
      ) : (
        <div className="flex w-full flex-wrap items-center gap-6 rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-[22px]">
          <div className="flex size-[100px] shrink-0 items-center justify-center rounded-[18px] bg-white/[0.04] text-[32px]">
            🍷
          </div>
          <div className="flex min-w-[220px] flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-[22px] font-semibold text-[var(--color-text-primary)]">
                {edicao.nome}
              </p>
              <span
                className={`flex h-[22px] items-center rounded-[999px] px-[10px] text-[11px] font-semibold ${
                  edicao.ativo
                    ? "bg-[rgba(74,222,128,0.13)] text-[var(--color-status-green)]"
                    : "bg-white/10 text-[var(--color-text-muted)]"
                }`}
              >
                {edicao.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <div>
                <p className="text-[12px] text-[var(--color-text-muted)]">Data</p>
                <p className="font-display text-[16px] text-[var(--color-text-primary)]">{formatData(edicao.dataEvento)}</p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--color-text-muted)]">Valor por pessoa</p>
                <p className="font-display text-[16px] text-[var(--color-text-primary)]">{formatBRL(edicao.valorPessoa)}</p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--color-text-muted)]">Cota</p>
                <p className="font-display text-[16px] text-[var(--color-text-primary)]">
                  {edicao.cotaVagas !== null ? `${edicao.vagasDisponiveis} / ${edicao.cotaVagas} vagas` : "não configurada"}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--color-text-muted)]">Pré-reservas pendentes</p>
                <p className="font-display text-[16px] text-[var(--color-text-primary)]">{pendentes}</p>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <EditarEdicaoDialog edicao={edicao} trigger="Editar edição" modo="editar" />
            <EditarEdicaoDialog edicao={edicao} trigger="Nova edição" modo="nova" />
          </div>
        </div>
      )}

      <SectionCard icon={Wine} title="Pré-reservas" className="w-full">
        {/* Mobile: lista de cartões — a tabela de colunas fixas não cabe numa tela pequena */}
        <div className="flex w-full flex-col gap-3 lg:hidden">
          {preReservas.length === 0 ? (
            <p className="px-[18px] py-8 text-center text-[13px] text-[var(--color-text-muted)]">
              Nenhuma pré-reserva registrada ainda.
            </p>
          ) : (
            preReservas.map((p) => (
              <div
                key={p.id}
                className="flex w-full flex-col gap-3 rounded-[16px] border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">{p.nome}</p>
                    <p className="text-[12px] text-[var(--color-text-muted)]">
                      {p.pessoas} pessoa{p.pessoas === 1 ? "" : "s"} · {formatData(p.data)}
                    </p>
                  </div>
                  <span
                    className={`flex h-[20px] shrink-0 items-center rounded-[999px] px-[8px] text-[10.5px] font-medium ${
                      p.canal === "presencial"
                        ? "bg-[rgba(125,211,252,0.13)] text-[var(--color-status-sky)]"
                        : "bg-white/[0.06] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {p.canal === "presencial" ? "Presencial" : "Online"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                  <StatusBadge status={p.statusPagamento} />
                  {p.comprovanteUrl ? (
                    <a href={p.comprovanteUrl} target="_blank" rel="noreferrer" className="text-[12.5px] font-medium text-[#d8b4fe] hover:underline">
                      Ver comprovante
                    </a>
                  ) : (
                    <span className="text-[12.5px] text-[var(--color-text-muted)]">Sem comprovante</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: tabela com colunas redimensionáveis */}
        <div className="hidden w-full lg:block">
          <TabelaRedimensionavel tableId="jantar-harmonizado-prereservas">
            <div className="flex w-full items-center gap-3 px-[18px] py-[9px] text-[12px] font-medium text-[var(--color-text-muted)]">
              <Coluna id="cliente" defaultWidth={240} header>Cliente</Coluna>
              <Coluna id="pessoas" defaultWidth={90} header>Pessoas</Coluna>
              <Coluna id="data" defaultWidth={110} header>Data</Coluna>
              <Coluna id="canal" defaultWidth={90} header>Canal</Coluna>
              <Coluna id="pagamento" defaultWidth={130} header>Pagamento</Coluna>
              <Coluna id="comprovante" defaultWidth={200} header>Comprovante</Coluna>
            </div>
            {preReservas.length === 0 ? (
              <p className="px-[18px] py-8 text-center text-[13px] text-[var(--color-text-muted)]">
                Nenhuma pré-reserva registrada ainda.
              </p>
            ) : (
              preReservas.map((p) => (
                <div key={p.id} className="flex w-full items-center gap-3 border-t border-white/5 px-[18px] py-3 text-[13px]">
                  <Coluna id="cliente" defaultWidth={240} className="text-[var(--color-text-primary)]">
                    {p.nome}
                  </Coluna>
                  <Coluna id="pessoas" defaultWidth={90} className="text-[var(--color-text-secondary)]">
                    {p.pessoas}
                  </Coluna>
                  <Coluna id="data" defaultWidth={110} className="text-[var(--color-text-secondary)]">
                    {formatData(p.data)}
                  </Coluna>
                  <Coluna id="canal" defaultWidth={90}>
                    <span
                      className={`flex h-[20px] w-fit items-center rounded-[999px] px-[8px] text-[10.5px] font-medium ${
                        p.canal === "presencial"
                          ? "bg-[rgba(125,211,252,0.13)] text-[var(--color-status-sky)]"
                          : "bg-white/[0.06] text-[var(--color-text-muted)]"
                      }`}
                    >
                      {p.canal === "presencial" ? "Presencial" : "Online"}
                    </span>
                  </Coluna>
                  <Coluna id="pagamento" defaultWidth={130}>
                    <StatusBadge status={p.statusPagamento} />
                  </Coluna>
                  <Coluna id="comprovante" defaultWidth={200}>
                    {p.comprovanteUrl ? (
                      <a href={p.comprovanteUrl} target="_blank" rel="noreferrer" className="font-medium text-[#d8b4fe] hover:underline">
                        Ver comprovante
                      </a>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    )}
                  </Coluna>
                </div>
              ))
            )}
          </TabelaRedimensionavel>
        </div>
      </SectionCard>
    </div>
  );
}
