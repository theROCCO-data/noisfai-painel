import { listCapacidadeDias } from "@/lib/data/capacidade";
import { VagasInput } from "@/components/capacidade/vagas-input";
import { CapacidadeTotalInput } from "@/components/capacidade/capacidade-total-input";
import { PeriodoDropdown } from "@/components/capacidade/periodo-dropdown";
import { TabelaRedimensionavel, Coluna } from "@/components/ui/tabela-redimensionavel";

export const dynamic = "force-dynamic";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function formatCurto(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function esteMes() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toLocaleDateString("en-CA");
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toLocaleDateString("en-CA");
  return { de: inicio, ate: fim };
}

export default async function CapacidadePage({ searchParams }: PageProps<"/capacidade">) {
  const sp = await searchParams;
  // sem período na URL: cai no mês corrente por padrão, não em "todos os
  // dias cadastrados" (que crescia sem fim e não era o filtro mais útil no
  // dia a dia).
  const semFiltro = typeof sp.de !== "string" && typeof sp.ate !== "string";
  const padrao = semFiltro ? esteMes() : { de: undefined, ate: undefined };
  const de = typeof sp.de === "string" ? sp.de : padrao.de;
  const ate = typeof sp.ate === "string" ? sp.ate : padrao.ate;
  const dias = await listCapacidadeDias(de, ate);

  const rotuloPeriodo = semFiltro ? "Este mês" : de && ate ? `${formatCurto(de)} – ${formatCurto(ate)}` : "Todos os dias cadastrados";
  const todosDias = dias.map((d) => ({ id: d.id, data: d.data }));

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] font-semibold text-[var(--color-text-primary)]">Capacidade</h1>
          <p className="text-[11.5px] text-[var(--color-text-muted)]">
            Pool único do dia — ajuste manual de vagas disponíveis quando necessário
          </p>
        </div>
        <PeriodoDropdown label={rotuloPeriodo} />
      </header>

      {/* Mobile: lista de cartões — a tabela de colunas fixas não cabe numa tela pequena */}
      <div className="flex w-full flex-col gap-3 lg:hidden">
        {dias.length === 0 ? (
          <p className="rounded-[20px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] px-[18px] py-10 text-center text-[13px] text-[var(--color-text-muted)]">
            Nenhum dia de capacidade encontrado nesse período.
          </p>
        ) : (
          dias.map((d) => {
            const consumidoPct = d.capacidadeBot > 0 ? (d.reservado / d.capacidadeBot) * 100 : 0;
            const lotado = d.disponivelAtual <= 0;
            const diaSemana = DIAS_SEMANA[new Date(d.data + "T00:00:00").getDay()];

            return (
              <div
                key={d.id}
                className="flex w-full flex-col gap-3 rounded-[20px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14.5px] font-semibold text-[var(--color-text-primary)]">
                      {new Date(d.data + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-[12.5px] text-[var(--color-text-secondary)]">{diaSemana}</p>
                  </div>
                  {lotado && (
                    <span className="flex h-[22px] shrink-0 items-center rounded-[999px] bg-[rgba(248,113,113,0.13)] px-[10px] text-[11px] font-semibold text-[var(--color-status-red)]">
                      Lotado
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 text-[12.5px]">
                  <div className="flex items-center justify-between text-[var(--color-text-muted)]">
                    <span>Vagas consumidas</span>
                    <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                      {d.reservado} de <CapacidadeTotalInput id={d.id} valorInicial={d.capacidadeBot} data={d.data} todosDias={todosDias} />
                    </span>
                  </div>
                  <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, consumidoPct)}%`,
                        backgroundImage: lotado
                          ? "linear-gradient(90deg, #fb923c, #f87171)"
                          : "linear-gradient(90deg, #a855f7, #7c3aed)",
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                  <span className="text-[12.5px] text-[var(--color-text-muted)]">Vagas disponíveis</span>
                  <VagasInput id={d.id} valorInicial={d.disponivelAtual} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop: tabela com colunas redimensionáveis */}
      <div className="hidden w-full lg:block">
        <TabelaRedimensionavel tableId="capacidade">
          <div className="w-full overflow-hidden rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)]">
            <div className="flex w-full items-center gap-3 border-b border-[var(--color-border)] px-[18px] py-[9px] text-[12px] font-medium text-[var(--color-text-muted)]">
              <Coluna id="data" defaultWidth={110} header>Data</Coluna>
              <Coluna id="dia" defaultWidth={90} header>Dia</Coluna>
              <Coluna id="capacidade" defaultWidth={120} header>Capacidade total</Coluna>
              <Coluna id="consumidas" defaultWidth={320} header>Vagas consumidas</Coluna>
              <Coluna id="disponiveis" defaultWidth={130} header>Vagas disponíveis</Coluna>
            </div>

            {dias.length === 0 ? (
              <p className="px-[18px] py-10 text-center text-[13px] text-[var(--color-text-muted)]">
                Nenhum dia de capacidade encontrado nesse período.
              </p>
            ) : (
              dias.map((d) => {
                const consumidoPct = d.capacidadeBot > 0 ? (d.reservado / d.capacidadeBot) * 100 : 0;
                const lotado = d.disponivelAtual <= 0;
                const diaSemana = DIAS_SEMANA[new Date(d.data + "T00:00:00").getDay()];

                return (
                  <div key={d.id} className="flex w-full items-center gap-3 border-t border-white/5 px-[18px] py-3 text-[13px]">
                    <Coluna id="data" defaultWidth={110} className="text-[var(--color-text-primary)]">
                      {new Date(d.data + "T00:00:00").toLocaleDateString("pt-BR")}
                    </Coluna>
                    <Coluna id="dia" defaultWidth={90} className="text-[var(--color-text-secondary)]">
                      {diaSemana}
                    </Coluna>
                    <Coluna id="capacidade" defaultWidth={120}>
                      <CapacidadeTotalInput id={d.id} valorInicial={d.capacidadeBot} data={d.data} todosDias={todosDias} />
                    </Coluna>
                    <Coluna id="consumidas" defaultWidth={320} className="flex items-center gap-3">
                      <span className="w-6 shrink-0 text-[var(--color-text-secondary)]">{d.reservado}</span>
                      <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, consumidoPct)}%`,
                            backgroundImage: lotado
                              ? "linear-gradient(90deg, #fb923c, #f87171)"
                              : "linear-gradient(90deg, #a855f7, #7c3aed)",
                          }}
                        />
                      </div>
                    </Coluna>
                    <Coluna id="disponiveis" defaultWidth={130} className="flex items-center gap-2">
                      <VagasInput id={d.id} valorInicial={d.disponivelAtual} />
                      {lotado && (
                        <span className="flex h-[22px] items-center rounded-[999px] bg-[rgba(248,113,113,0.13)] px-[10px] text-[11px] font-semibold text-[var(--color-status-red)]">
                          Lotado
                        </span>
                      )}
                    </Coluna>
                  </div>
                );
              })
            )}
          </div>
        </TabelaRedimensionavel>
      </div>
    </div>
  );
}
