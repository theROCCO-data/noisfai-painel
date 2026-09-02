import { Search, ChevronLeft, ChevronRight, Users, UserPlus, Repeat } from "lucide-react";
import Link from "next/link";
import { listClientes, getClientesStats } from "@/lib/data/clientes";
import { KpiCard } from "@/components/ui/kpi-card";
import { PeriodoDropdown } from "@/components/clientes/periodo-dropdown";
import { ExportarDropdown } from "@/components/clientes/exportar-dropdown";
import { TabelaRedimensionavel, Coluna } from "@/components/ui/tabela-redimensionavel";

export const dynamic = "force-dynamic";

function buildHref(base: Record<string, string | undefined>, overrides: Record<string, string | number>) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
  }
  return `/clientes?${params.toString()}`;
}

export default async function ClientesPage({
  searchParams,
}: PageProps<"/clientes">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const de = typeof sp.de === "string" ? sp.de : undefined;
  const ate = typeof sp.ate === "string" ? sp.ate : undefined;
  const page = typeof sp.page === "string" ? Number(sp.page) : 1;

  const [{ clientes, total, pageSize }, stats] = await Promise.all([
    listClientes({ q, de, ate, page }),
    getClientesStats({ de, ate }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const baseParams = { q, de, ate };

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] font-semibold text-[var(--color-text-primary)]">Clientes</h1>
          <p className="text-[11.5px] text-[var(--color-text-muted)]">
            {total} clientes cadastrados
          </p>
        </div>
      </header>

      <section className="flex w-full flex-wrap gap-[14px]">
        <KpiCard icon={Users} label="CLIENTES CADASTRADOS" value={stats.total} hint="no total" />
        <KpiCard
          icon={UserPlus}
          label="NOVOS NO PERÍODO"
          value={stats.novosNoPeriodo}
          hint={de && ate ? "no período filtrado" : "últimos 30 dias por padrão"}
        />
        <KpiCard icon={Repeat} label="CLIENTES RECORRENTES" value={stats.recorrentes} hint="2+ reservas confirmadas" highlighted />
      </section>

      <div className="flex w-full flex-wrap items-center gap-3">
        <form className="flex flex-1 items-center gap-3" action="/clientes">
          {de && <input type="hidden" name="de" value={de} />}
          {ate && <input type="hidden" name="ate" value={ate} />}
          <div className="flex h-[34px] w-full items-center gap-2 rounded-[10px] border border-[var(--color-border-soft)] bg-white/[0.03] px-3 sm:w-[320px]">
            <Search size={14} className="text-[var(--color-text-muted)]" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar nome, telefone, CPF ou e-mail"
              className="w-full bg-transparent text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="h-[34px] shrink-0 rounded-[10px] border border-[var(--color-border-soft)] px-4 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-white/[0.03]"
          >
            Filtrar
          </button>
        </form>
        <div className="hidden h-px flex-1 sm:block" />
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <PeriodoDropdown q={q} de={de} ate={ate} />
          <ExportarDropdown q={q} de={de} ate={ate} />
        </div>
      </div>

      {/* Mobile: lista de cartões — a tabela de colunas fixas não cabe numa tela pequena */}
      <div className="flex w-full flex-col gap-3 lg:hidden">
        {clientes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[20px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] px-[18px] py-12 text-center">
            <Users size={22} className="text-[var(--color-text-muted)]" />
            <p className="text-[13px] text-[var(--color-text-muted)]">
              {q ? "Nenhum cliente encontrado com esse filtro." : "Nenhum cliente cadastrado ainda. Clientes entram aqui automaticamente ao fazer uma reserva."}
            </p>
          </div>
        ) : (
          clientes.map((c) => (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="flex w-full flex-col gap-3 rounded-[20px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-4"
            >
              <div className="flex flex-col gap-0.5">
                <p className="truncate text-[14.5px] font-semibold text-[var(--color-text-primary)]">{c.nome}</p>
                <p className="text-[12.5px] text-[var(--color-text-secondary)]">{c.telefone}</p>
              </div>

              <div className="flex flex-col gap-0.5 text-[12.5px]">
                <span className="text-[10.5px] text-[var(--color-text-muted)]">CPF</span>
                <span className="text-[var(--color-text-secondary)]">{c.cpf ?? "—"}</span>
              </div>
              <div className="flex flex-col gap-0.5 text-[12.5px]">
                <span className="text-[10.5px] text-[var(--color-text-muted)]">E-mail</span>
                <span className="truncate text-[var(--color-text-secondary)]">{c.email ?? "—"}</span>
              </div>
              <div className="flex flex-col gap-0.5 text-[12.5px]">
                <span className="text-[10.5px] text-[var(--color-text-muted)]">Cliente desde</span>
                <span className="text-[var(--color-text-secondary)]">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>

              <div className="flex items-center justify-end border-t border-white/5 pt-3">
                <span className="flex h-[30px] items-center whitespace-nowrap rounded-[8px] border border-[var(--color-border-soft)] px-3 text-[12.5px] font-medium text-[var(--color-text-secondary)]">
                  Ver detalhes
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Desktop: tabela com colunas redimensionáveis */}
      <div className="hidden w-full lg:block">
        <TabelaRedimensionavel tableId="clientes">
          <div className="w-full overflow-hidden rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)]">
            <div className="flex w-full items-center border-b border-[var(--color-border)] px-[18px] py-[9px] text-[12px] font-medium text-[var(--color-text-muted)]">
              <div className="flex flex-1 items-center gap-3">
                <Coluna id="nome" defaultWidth={260} header>Nome</Coluna>
                <Coluna id="telefone" defaultWidth={150} header>Telefone</Coluna>
                <Coluna id="cpf" defaultWidth={160} header>CPF</Coluna>
                <Coluna id="email" defaultWidth={220} header>E-mail</Coluna>
                <Coluna id="desde" defaultWidth={130} header>Cliente desde</Coluna>
              </div>
              <p className="w-[130px] shrink-0 border-l border-white/10 pl-4">Ações</p>
            </div>

            {clientes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-[18px] py-12 text-center">
                <Users size={22} className="text-[var(--color-text-muted)]" />
                <p className="text-[13px] text-[var(--color-text-muted)]">
                  {q ? "Nenhum cliente encontrado com esse filtro." : "Nenhum cliente cadastrado ainda. Clientes entram aqui automaticamente ao fazer uma reserva."}
                </p>
              </div>
            ) : (
              clientes.map((c) => (
                <Link
                  key={c.id}
                  href={`/clientes/${c.id}`}
                  className="flex w-full items-center border-b border-white/5 px-[18px] py-3 text-[13px] last:border-0 hover:bg-white/[0.03]"
                >
                  <div className="flex flex-1 items-center gap-3">
                    <Coluna id="nome" defaultWidth={260} className="truncate font-medium text-[var(--color-text-primary)]">
                      {c.nome}
                    </Coluna>
                    <Coluna id="telefone" defaultWidth={150} className="text-[var(--color-text-secondary)]">
                      {c.telefone}
                    </Coluna>
                    <Coluna id="cpf" defaultWidth={160} className="text-[var(--color-text-secondary)]">
                      {c.cpf ?? "—"}
                    </Coluna>
                    <Coluna id="email" defaultWidth={220} className="truncate text-[var(--color-text-secondary)]">
                      {c.email ?? "—"}
                    </Coluna>
                    <Coluna id="desde" defaultWidth={130} className="text-[var(--color-text-secondary)]">
                      {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                    </Coluna>
                  </div>
                  <div className="flex w-[130px] shrink-0 items-center border-l border-white/10 pl-4">
                    <span className="flex h-[30px] items-center whitespace-nowrap rounded-[8px] border border-[var(--color-border-soft)] px-3 text-[12.5px] font-medium text-[var(--color-text-secondary)]">
                      Ver detalhes
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </TabelaRedimensionavel>
      </div>

      <div className="flex w-full items-center justify-end gap-4 text-[13px] text-[var(--color-text-muted)]">
        <span>
          Mostrando {clientes.length} de {total}
        </span>
        <div className="flex gap-2">
          <Link
            href={buildHref(baseParams, { page: Math.max(1, page - 1) })}
            aria-disabled={page <= 1}
            className={`flex size-[26px] items-center justify-center rounded-[8px] border border-white/10 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-white/20"}`}
          >
            <ChevronLeft size={14} />
          </Link>
          <Link
            href={buildHref(baseParams, { page: Math.min(totalPages, page + 1) })}
            aria-disabled={page >= totalPages}
            className={`flex size-[26px] items-center justify-center rounded-[8px] border border-white/10 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-white/20"}`}
          >
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
