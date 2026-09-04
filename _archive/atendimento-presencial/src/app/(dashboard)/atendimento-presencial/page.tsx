import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { listAtendimentosPresenciais } from "@/lib/data/atendimento-presencial";
import { listCardapio } from "@/lib/data/cardapio";
import { NovoAtendimentoDialog } from "@/components/atendimento-presencial/novo-atendimento-dialog";
import { TabelaRedimensionavel, Coluna } from "@/components/ui/tabela-redimensionavel";

export const dynamic = "force-dynamic";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default async function AtendimentoPresencialPage() {
  const [atendimentos, cardapio] = await Promise.all([listAtendimentosPresenciais(), listCardapio()]);
  const itensPresenciais = cardapio.itens.filter((i) => i.disponivelPresencial);

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] font-semibold text-[var(--color-text-primary)]">Atendimento Presencial</h1>
          <p className="text-[11.5px] text-[var(--color-text-muted)]">
            Clientes que comeram no restaurante sem reserva prévia.
          </p>
        </div>
        <NovoAtendimentoDialog itensCardapio={itensPresenciais} />
      </header>

      {/* Mobile: lista de cartões */}
      <div className="flex w-full flex-col gap-3 lg:hidden">
        {atendimentos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[20px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] px-[18px] py-12 text-center">
            <UtensilsCrossed size={22} className="text-[var(--color-text-muted)]" />
            <p className="text-[13px] text-[var(--color-text-muted)]">Nenhum atendimento presencial registrado ainda.</p>
          </div>
        ) : (
          atendimentos.map((a) => (
            <Link
              key={a.id}
              href={`/clientes/${a.clienteId}`}
              className="flex w-full flex-col gap-2 rounded-[20px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[14.5px] font-semibold text-[var(--color-text-primary)]">{a.clienteNome}</p>
                <span className="shrink-0 text-[12px] text-[var(--color-text-muted)]">{formatDataHora(a.criadoEm)}</span>
              </div>
              <p className="text-[12.5px] text-[var(--color-text-secondary)]">
                {a.itens.map((i) => `${i.quantidade}x ${i.nomeItem}`).join(", ")}
              </p>
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{formatBRL(a.total)}</p>
            </Link>
          ))
        )}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden w-full lg:block">
        <TabelaRedimensionavel tableId="atendimento-presencial">
          <div className="w-full overflow-hidden rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)]">
            <div className="flex w-full items-center gap-3 border-b border-[var(--color-border)] px-[18px] py-[9px] text-[12px] font-medium text-[var(--color-text-muted)]">
              <Coluna id="data" defaultWidth={130} header>Data/hora</Coluna>
              <Coluna id="cliente" defaultWidth={220} header>Cliente</Coluna>
              <Coluna id="itens" defaultWidth={380} header>Itens</Coluna>
              <Coluna id="total" defaultWidth={110} header>Total</Coluna>
            </div>

            {atendimentos.length === 0 ? (
              <p className="px-[18px] py-10 text-center text-[13px] text-[var(--color-text-muted)]">
                Nenhum atendimento presencial registrado ainda.
              </p>
            ) : (
              atendimentos.map((a) => (
                <Link
                  key={a.id}
                  href={`/clientes/${a.clienteId}`}
                  className="flex w-full items-center gap-3 border-b border-white/5 px-[18px] py-3 text-[13px] last:border-0 hover:bg-white/[0.03]"
                >
                  <Coluna id="data" defaultWidth={130} className="text-[var(--color-text-secondary)]">
                    {formatDataHora(a.criadoEm)}
                  </Coluna>
                  <Coluna id="cliente" defaultWidth={220} className="truncate font-medium text-[var(--color-text-primary)]">
                    {a.clienteNome}
                  </Coluna>
                  <Coluna id="itens" defaultWidth={380} className="truncate text-[var(--color-text-secondary)]">
                    {a.itens.map((i) => `${i.quantidade}x ${i.nomeItem}`).join(", ")}
                  </Coluna>
                  <Coluna id="total" defaultWidth={110} className="font-medium text-[var(--color-text-primary)]">
                    {formatBRL(a.total)}
                  </Coluna>
                </Link>
              ))
            )}
          </div>
        </TabelaRedimensionavel>
      </div>
    </div>
  );
}
