import { Sparkles, TrendingUp, Users, UserPlus, LineChart, GitBranch, PieChart, Target, User, UserCheck, UserX } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionCard } from "@/components/ui/section-card";
import { PeriodoDropdown } from "@/components/analises/periodo-dropdown";
import { getAnalises } from "@/lib/data/analises";
import { fraseDoDia } from "@/lib/frases-nyx";

export const dynamic = "force-dynamic";

const ORIGEM_CORES: Record<string, string> = {
  bot: "#a855f7",
  painel: "#7dd3fc",
  gerente: "#7dd3fc",
  telefone: "#87809f",
  "não informado": "#87809f",
};

const CANAL_CORES: Record<string, string> = {
  online: "#a855f7",
  presencial: "#7dd3fc",
};
const CANAL_LABELS: Record<string, string> = {
  online: "Online (bot)",
  presencial: "Presencial (balcão)",
};

function formatDataCurta(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default async function AnalisesPage({
  searchParams,
}: PageProps<"/analises">) {
  const sp = await searchParams;
  const de = typeof sp.de === "string" ? sp.de : undefined;
  const ate = typeof sp.ate === "string" ? sp.ate : undefined;

  const dados = await getAnalises({ de, ate });
  const maxSerie = Math.max(1, ...dados.serieTemporal.map((d) => d.total));
  const totalOrigem = dados.origemReservas.reduce((acc, o) => acc + o.total, 0);
  const totalCanal = dados.canalReservas.reduce((acc, o) => acc + o.total, 0);
  const maxResponsavel = Math.max(1, ...dados.performancePorResponsavel.map((r) => r.total));

  const formatCurtoAno2 = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  const periodoLabel = `${formatCurtoAno2(dados.periodo.de)} – ${formatCurtoAno2(dados.periodo.ate)}`;

  return (
    <div className="flex w-full flex-col gap-[22px]">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] font-semibold text-[var(--color-text-primary)]">Análises</h1>
          <p className="text-[11.5px] text-[var(--color-text-muted)]">Desempenho do chatbot e das reservas</p>
        </div>
        <PeriodoDropdown label={periodoLabel} de={dados.periodo.de} ate={dados.periodo.ate} />
      </header>

      <section className="flex w-full flex-wrap gap-[14px]">
        <KpiCard icon={TrendingUp} label="RESERVAS CONFIRMADAS" value={dados.reservasConfirmadas} hint="via qualquer origem" />
        <KpiCard
          icon={LineChart}
          label="TAXA DE CONVERSÃO DO BOT"
          value={`${dados.taxaConversao.toFixed(1)}%`}
          hint="reservas / conversas iniciadas"
        />
        <KpiCard icon={Users} label="CONVERSAS INICIADAS (LEADS)" value={dados.conversasIniciadas} hint="no período" />
        <KpiCard icon={UserPlus} label="NOVOS CLIENTES CAPTADOS" value={dados.novosClientes} hint="cadastros novos" />
        <KpiCard
          icon={Target}
          label="LEADS CONVERTIDOS EM RESERVA"
          value={dados.leadsConvertidos}
          valueSuffix={`(${dados.taxaLeadsConvertidos.toFixed(0)}%)`}
          hint="conversas que viraram reserva"
          highlighted
        />
      </section>

      <SectionCard icon={LineChart} title="Reservas ao longo do tempo" className="w-full">
        <div className="flex h-[180px] w-full items-end gap-[3px] px-[18px] py-4">
          {dados.serieTemporal.map((d) => (
            <div key={d.data} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
              {d.total > 0 && (
                <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">{d.total}</span>
              )}
              <div
                className="w-full rounded-t-[2px] bg-gradient-to-t from-[#7c3aed] to-[#a855f7]"
                style={{ height: `${Math.max(2, (d.total / maxSerie) * 140)}px` }}
                title={`${d.data}: ${d.total}`}
              />
            </div>
          ))}
        </div>
        <div className="flex w-full justify-between px-[18px] pb-3 text-[11px] text-[var(--color-text-muted)]">
          <span>{dados.serieTemporal[0] ? formatDataCurta(dados.serieTemporal[0].data) : ""}</span>
          <span>
            {dados.serieTemporal[dados.serieTemporal.length - 1]
              ? formatDataCurta(dados.serieTemporal[dados.serieTemporal.length - 1].data)
              : ""}
          </span>
        </div>
      </SectionCard>

      <section className="flex w-full flex-wrap gap-4">
        <SectionCard icon={GitBranch} title="Funil do Chatbot" className="min-w-[320px] flex-1">
          <div className="flex flex-col gap-4 px-[18px] py-4">
            <FunnelBar label="Conversas iniciadas" value={dados.conversasIniciadas} max={Math.max(1, dados.conversasIniciadas)} />
            <FunnelBar label="Leads convertidos em reserva" value={dados.leadsConvertidos} max={Math.max(1, dados.conversasIniciadas)} />
            <FunnelBar label="Reservas confirmadas" value={dados.reservasConfirmadas} max={Math.max(1, dados.conversasIniciadas)} />
          </div>
        </SectionCard>

        <SectionCard icon={PieChart} title="Canal da reserva" className="min-w-[280px] flex-1">
          <div className="flex flex-col gap-2 px-[18px] py-4">
            {dados.canalReservas.length === 0 ? (
              <p className="text-[13px] text-[var(--color-text-muted)]">Sem reservas no período pra calcular canal.</p>
            ) : (
              dados.canalReservas.map((o) => {
                const pct = totalCanal > 0 ? (o.total / totalCanal) * 100 : 0;
                const cor = CANAL_CORES[o.canal] ?? "#87809f";
                return (
                  <div key={o.canal} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2 text-[var(--color-text-primary)]">
                        <span className="size-2 rounded-full" style={{ backgroundColor: cor }} />
                        {CANAL_LABELS[o.canal] ?? o.canal}
                      </span>
                      <span className="text-[var(--color-text-secondary)]">
                        {o.total} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-[6px] w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cor }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard icon={PieChart} title="Origem da alteração" className="min-w-[280px] flex-1">
          <div className="flex flex-col gap-2 px-[18px] py-4">
            {dados.origemReservas.length === 0 ? (
              <p className="text-[13px] text-[var(--color-text-muted)]">Sem reservas no período pra calcular origem.</p>
            ) : (
              dados.origemReservas.map((o) => {
                const pct = totalOrigem > 0 ? (o.total / totalOrigem) * 100 : 0;
                const cor = ORIGEM_CORES[o.origem] ?? "#87809f";
                return (
                  <div key={o.origem} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2 text-[var(--color-text-primary)]">
                        <span className="size-2 rounded-full" style={{ backgroundColor: cor }} />
                        {o.origem}
                      </span>
                      <span className="text-[var(--color-text-secondary)]">
                        {o.total} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-[6px] w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cor }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      </section>

      <section className="flex w-full flex-wrap gap-4">
        <SectionCard icon={User} title="Performance de reservas por responsável" className="min-w-[280px] flex-[2]">
          <div className="flex flex-col gap-4 px-[18px] py-4">
            {dados.performancePorResponsavel.length === 0 ? (
              <p className="text-[13px] text-[var(--color-text-muted)]">Sem reservas no período.</p>
            ) : (
              dados.performancePorResponsavel.map((r) => (
                <FunnelBar key={r.nome} label={r.nome} value={r.total} max={maxResponsavel} />
              ))
            )}
          </div>
        </SectionCard>

        <div className="flex min-w-[220px] flex-1 flex-col gap-4">
          <KpiCard icon={UserCheck} label="LEADS QUE COMPARECERAM" value={dados.compareceram} hint="marcado como comparecimento" />
          <KpiCard icon={UserX} label="LEADS QUE NÃO COMPARECERAM" value={dados.naoCompareceram} hint="marcado como não comparecimento" />
        </div>
      </section>

      <div
        className="flex w-full items-center gap-3 rounded-[26px] border border-[rgba(168,85,247,0.28)] p-5"
        style={{ backgroundImage: "linear-gradient(163deg, rgba(168,85,247,0.14) 14%, rgba(109,40,217,0.08) 86%)" }}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-[rgba(168,85,247,0.16)]">
          <Sparkles size={16} className="text-[#d8b4fe]" />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="font-display text-[14px] italic text-[var(--color-text-primary)]">&quot;{fraseDoDia()}&quot;</p>
          <span className="text-[11px] font-medium text-[#d8b4fe]">— Nyx</span>
        </div>
      </div>
    </div>
  );
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-[var(--color-text-primary)]">{label}</span>
        <span className="font-display font-medium text-[var(--color-text-primary)]">{value}</span>
      </div>
      <div className="h-[22px] w-full overflow-hidden rounded-[8px] bg-white/[0.05]">
        <div
          className="h-full rounded-[8px] bg-gradient-to-r from-[#a855f7] to-[#7c3aed]"
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </div>
    </div>
  );
}
