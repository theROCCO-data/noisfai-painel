import Link from "next/link";
import { CalendarCheck, Armchair, Wallet, Headset, Sparkles, MessageCircle, CalendarPlus } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Relogio } from "@/components/ui/relogio";
import { AutoRefresh } from "@/components/conversas/auto-refresh";
import {
  getReservasHoje,
  getVagasHoje,
  getPagamentosPendentesJH,
  getConversasComHumano,
  getConversasIniciadasHoje,
  getReservasFeitasHoje,
  formatTempoDecorrido,
} from "@/lib/data/dashboard";

export const dynamic = "force-dynamic";

function formatDataExtenso() {
  const hoje = new Date();
  const texto = hoje.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function InicioPage() {
  const [reservasHoje, vagasHoje, pagamentosPendentes, conversasComHumano, conversasIniciadasHoje, reservasFeitasHoje] =
    await Promise.all([
      getReservasHoje(),
      getVagasHoje(),
      getPagamentosPendentesJH(),
      getConversasComHumano(),
      getConversasIniciadasHoje(),
      getReservasFeitasHoje(),
    ]);

  const vagasPct = vagasHoje.total > 0 ? (vagasHoje.disponivel / vagasHoje.total) * 100 : 0;

  return (
    <div className="flex w-full flex-col gap-[22px]">
      <AutoRefresh intervalMs={8000} />
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] font-semibold text-[var(--color-text-primary)]">Início</h1>
        <p className="flex items-center gap-1.5 text-[11.5px] text-[var(--color-text-muted)]">
          {formatDataExtenso()}
          <span className="text-[var(--color-text-muted)]">·</span>
          <Relogio />
        </p>
      </header>

      <section className="flex w-full flex-wrap items-start gap-[14px] p-[5px]">
        <KpiCard
          icon={CalendarCheck}
          label="RESERVAS HOJE"
          value={reservasHoje.total}
          hint={`${reservasHoje.almoco} almoço · ${reservasHoje.jantar} jantar`}
        />
        <KpiCard
          icon={Armchair}
          label="VAGAS DISPONÍVEIS HOJE"
          value={vagasHoje.disponivel}
          valueSuffix={`/ ${vagasHoje.total}`}
          hint="pool único do dia"
          highlighted
          progressPct={vagasPct}
        />
        <KpiCard
          icon={Wallet}
          label="PAGAMENTOS PENDENTES"
          value={pagamentosPendentes.length}
          hint="Jantar Harmonizado"
        />
        <KpiCard
          icon={Headset}
          label="PRECISA DE ATENÇÃO"
          value={conversasComHumano.length}
          hint="clientes pedindo humano"
        />
        <KpiCard
          icon={MessageCircle}
          label="CONVERSAS INICIADAS HOJE"
          value={conversasIniciadasHoje}
          hint="clientes novos no WhatsApp"
        />
        <KpiCard
          icon={CalendarPlus}
          label="RESERVAS FEITAS HOJE"
          value={reservasFeitasHoje}
          hint="lançadas hoje (bot ou balcão)"
        />
      </section>

      <section className="flex w-full flex-col items-stretch gap-4 px-[6px] py-[5px] lg:flex-row lg:items-start">
        <SectionCard icon={CalendarCheck} title="Reservas de hoje" action={{ label: "Ver todas", href: "/reservas" }} className="h-[287px] w-full lg:flex-1">
          {reservasHoje.lista.length === 0 ? (
            <p className="px-[18px] py-6 text-[13px] text-[var(--color-text-muted)]">
              Nenhuma reserva pra hoje ainda.
            </p>
          ) : (
            <div className="flex w-full flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
              {reservasHoje.lista.map((r) => (
                <div
                  key={r.id}
                  className="flex w-full shrink-0 items-center gap-3 rounded-[16px] border border-white/5 bg-white/[0.03] px-[18px] py-[11px]"
                >
                  <p className="w-[46px] font-display text-[13px] font-medium text-[var(--color-text-secondary)]">
                    {r.horario?.slice(0, 5)}
                  </p>
                  <p className="flex-1 text-[13px] font-medium text-[var(--color-text-primary)]">{r.nome}</p>
                  <p className="text-[13px] text-[var(--color-text-muted)]">{r.pessoas}</p>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={Sparkles} title="Precisa de atenção" action={{ label: "Ver conversas", href: "/conversas" }} className="h-[287px] w-full lg:flex-1">
          {conversasComHumano.length === 0 ? (
            <p className="px-[18px] py-6 text-[13px] text-[var(--color-text-muted)]">
              Nenhuma conversa com humano no momento — o bot está cuidando de tudo.
            </p>
          ) : (
            <div className="flex w-full flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
              {conversasComHumano.map((c) => (
                <Link
                  key={c.conversationId}
                  href={`/conversas/${c.conversationId}`}
                  className="flex w-full flex-col gap-1 rounded-[16px] border border-[rgba(168,85,247,0.22)] bg-[#1d1436] px-4 py-3 hover:border-[rgba(168,85,247,0.4)]"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{c.telefoneFormatado}</p>
                    <span className="flex h-[18px] items-center rounded-[999px] bg-[rgba(251,191,36,0.16)] px-[8px] text-[10.5px] font-semibold text-[var(--color-status-amber)]">
                      ATENÇÃO
                    </span>
                  </div>
                  <p className="line-clamp-1 text-[11.5px] italic text-[var(--color-text-secondary)]">
                    &quot;{c.ultimaMensagem || "—"}&quot;
                  </p>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </section>

      <SectionCard
        icon={Wallet}
        title="Pagamentos pendentes — Jantar Harmonizado"
        action={{ label: "Ver evento", href: "/jantar-harmonizado" }}
        className="w-full"
      >
        {/* Mobile: lista de cartões — a linha de colunas fixas não cabe numa tela pequena */}
        <div className="flex w-full flex-col gap-3 p-[14px] lg:hidden">
          {pagamentosPendentes.length === 0 ? (
            <p className="px-[4px] py-4 text-[13px] text-[var(--color-text-muted)]">
              Nenhum pagamento pendente no momento.
            </p>
          ) : (
            pagamentosPendentes.map((p) => {
              const tempo = formatTempoDecorrido(p.criadoEm);
              return (
                <div key={p.id} className="flex w-full flex-col gap-2 rounded-[16px] border border-white/5 bg-white/[0.02] p-4 text-[13px]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-[var(--color-text-primary)]">{p.nome}</p>
                    <p className="font-display font-medium text-[var(--color-text-primary)]">{formatBRL(p.valorEsperado)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="text-[var(--color-text-muted)]">{p.pessoas} pessoa{p.pessoas === 1 ? "" : "s"}</span>
                    <span className={tempo.atrasado ? "text-[var(--color-status-amber)]" : "text-[var(--color-text-muted)]"}>
                      Enviado {tempo.texto}
                    </span>
                  </div>
                  {p.comprovanteUrl ? (
                    <a href={p.comprovanteUrl} target="_blank" rel="noreferrer" className="font-medium text-[#d8b4fe] hover:underline">
                      Ver imagem
                    </a>
                  ) : (
                    <p className="text-[var(--color-text-muted)]">Sem comprovante</p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop: tabela de colunas fixas */}
        <div className="hidden lg:block">
          <div className="flex w-full gap-3 px-[18px] py-[9px] text-[10.5px] font-medium tracking-[0.42px] text-[var(--color-text-muted)]">
            <p className="flex-1">CLIENTE</p>
            <p className="w-[90px]">PESSOAS</p>
            <p className="w-[130px]">VALOR ESPERADO</p>
            <p className="w-[120px]">ENVIADO HÁ</p>
            <p className="w-[130px]">COMPROVANTE</p>
          </div>
          {pagamentosPendentes.length === 0 ? (
            <p className="px-[18px] py-6 text-[13px] text-[var(--color-text-muted)]">
              Nenhum pagamento pendente no momento.
            </p>
          ) : (
            pagamentosPendentes.map((p) => {
              const tempo = formatTempoDecorrido(p.criadoEm);
              return (
                <div
                  key={p.id}
                  className="flex w-full items-center gap-3 border-t border-white/5 px-[18px] py-[11px] text-[13px]"
                >
                  <p className="flex-1 text-[var(--color-text-primary)]">{p.nome}</p>
                  <p className="w-[90px] text-[var(--color-text-primary)]">{p.pessoas}</p>
                  <p className="w-[130px] font-display font-medium text-[var(--color-text-primary)]">
                    {formatBRL(p.valorEsperado)}
                  </p>
                  <p className={`w-[120px] ${tempo.atrasado ? "text-[var(--color-status-amber)]" : "text-[var(--color-text-muted)]"}`}>
                    {tempo.texto}
                  </p>
                  {p.comprovanteUrl ? (
                    <a
                      href={p.comprovanteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-[130px] font-medium text-[#d8b4fe] hover:underline"
                    >
                      Ver imagem
                    </a>
                  ) : (
                    <p className="w-[130px] text-[var(--color-text-muted)]">Sem comprovante</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SectionCard>
    </div>
  );
}
