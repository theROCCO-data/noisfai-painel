import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { listReservas, countReservasMesAtual } from "@/lib/data/reservas";
import { listUsuarios } from "@/lib/data/usuarios";
import { StatusSelect } from "@/components/reservas/status-select";
import { NovaReservaDialog } from "@/components/reservas/nova-reserva-dialog";
import { CancelarReservaButton } from "@/components/reservas/cancelar-reserva-button";
import { ReservaDetalhesDialog } from "@/components/reservas/reserva-detalhes-dialog";
import { ObservacaoPopup } from "@/components/reservas/observacao-popup";
import { PeriodoDropdown } from "@/components/reservas/periodo-dropdown";
import { CustomSelect } from "@/components/ui/custom-select";
import { TabelaRedimensionavel, Coluna } from "@/components/ui/tabela-redimensionavel";

export const dynamic = "force-dynamic";

function buildHref(base: Record<string, string | undefined>, overrides: Record<string, string | number>) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
  }
  return `/reservas?${params.toString()}`;
}

function hojeISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}
function somarDias(iso: string, dias: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString("en-CA");
}
/** Hoje até sábado desta semana (fuso de Brasília) — só pra frente, sem mostrar dias que já passaram. */
function semanaAtual() {
  const hoje = hojeISO();
  const diaSemana = new Date(hoje + "T00:00:00").getDay();
  return { de: hoje, ate: somarDias(hoje, 6 - diaSemana) };
}

export default async function ReservasPage({
  searchParams,
}: PageProps<"/reservas">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const canal = typeof sp.canal === "string" ? sp.canal : undefined;
  const page = typeof sp.page === "string" ? Number(sp.page) : 1;
  const periodoTodos = sp.periodo === "todos";
  const dataDeParam = typeof sp.dataDe === "string" ? sp.dataDe : undefined;
  const dataAteParam = typeof sp.dataAte === "string" ? sp.dataAte : undefined;

  // padrão ao entrar na tela, sem filtro nenhum aplicado ainda: esta semana
  // (direciona pro que importa agora, em vez de mostrar tudo desde sempre).
  // "Limpar filtro" manda periodo=todos pra sair desse padrão de propósito.
  const semanaPadrao = !periodoTodos && !dataDeParam && !dataAteParam ? semanaAtual() : null;
  const dataDe = semanaPadrao?.de ?? dataDeParam;
  const dataAte = semanaPadrao?.ate ?? dataAteParam;

  const [{ reservas, total, pageSize }, totalMes, usuarios] = await Promise.all([
    listReservas({ q, status, canal, dataDe, dataAte, page }),
    countReservasMesAtual(),
    listUsuarios(),
  ]);

  const atendentes = usuarios.filter((u) => u.cargo !== "Desenvolvedor");
  const nomePorUsuarioId = new Map(usuarios.map((u) => [u.id, u.nome]));
  function nomeResponsavel(responsavelUserId: string | null) {
    if (!responsavelUserId) return "Chatbot IA";
    return nomePorUsuarioId.get(responsavelUserId) ?? "Usuário removido";
  }

  const nomeMes = new Date().toLocaleDateString("pt-BR", { month: "long", timeZone: "America/Sao_Paulo" });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const baseParams = { q, status, canal, dataDe, dataAte, periodo: periodoTodos ? "todos" : undefined };

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] font-semibold text-[var(--color-text-primary)]">Reservas</h1>
          <p className="text-[11.5px] text-[var(--color-text-muted)]">
            {totalMes} reservas em {nomeMes}
          </p>
        </div>
      </header>

      <div className="flex w-full flex-wrap items-center gap-3">
        <form className="flex flex-1 flex-wrap items-center gap-3" action="/reservas">
          {dataDe && <input type="hidden" name="dataDe" value={dataDe} />}
          {dataAte && <input type="hidden" name="dataAte" value={dataAte} />}
          {periodoTodos && <input type="hidden" name="periodo" value="todos" />}
          <div className="flex h-[34px] w-full items-center gap-2 rounded-[10px] border border-[var(--color-border-soft)] bg-white/[0.03] px-3 sm:w-[240px]">
            <Search size={14} className="text-[var(--color-text-muted)]" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar cliente ou telefone"
              className="w-full bg-transparent text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>
          <div className="w-[calc(50%-6px)] sm:w-[160px]">
            <CustomSelect
              name="status"
              defaultValue={status ?? "todos"}
              options={[
                { value: "todos", label: "Todos os status" },
                { value: "confirmada", label: "Confirmado" },
                { value: "pendente", label: "Pendente" },
                { value: "compareceu", label: "Compareceu" },
                { value: "nao_compareceu", label: "Não compareceu" },
                { value: "cancelada", label: "Cancelado" },
              ]}
            />
          </div>
          <div className="w-[calc(50%-6px)] sm:w-[150px]">
            <CustomSelect
              name="canal"
              defaultValue={canal ?? "todos"}
              options={[
                { value: "todos", label: "Todos os canais" },
                { value: "online", label: "Online" },
                { value: "presencial", label: "Presencial" },
              ]}
            />
          </div>
          <button
            type="submit"
            className="h-[34px] rounded-[10px] border border-[var(--color-border-soft)] px-4 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-white/[0.03]"
          >
            Filtrar
          </button>
        </form>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <PeriodoDropdown q={q} status={status} canal={canal} dataDe={dataDe} dataAte={dataAte} />
          <NovaReservaDialog atendentes={atendentes} />
        </div>
      </div>

      {/* Mobile: lista de cartões — a tabela de colunas fixas não cabe numa tela pequena */}
      <div className="flex w-full flex-col gap-3 lg:hidden">
        {reservas.length === 0 ? (
          <p className="rounded-[20px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] px-[18px] py-10 text-center text-[13px] text-[var(--color-text-muted)]">
            Nenhuma reserva encontrada com esses filtros.
          </p>
        ) : (
          reservas.map((r) => (
            <div
              key={r.id}
              className="flex w-full flex-col gap-3 rounded-[20px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[14.5px] font-semibold text-[var(--color-text-primary)]">{r.nome}</p>
                  <p className="text-[12.5px] text-[var(--color-text-secondary)]">{r.telefone}</p>
                </div>
                <span
                  className={`flex h-[20px] shrink-0 items-center rounded-[999px] px-[8px] text-[10.5px] font-medium ${
                    r.canal === "presencial"
                      ? "bg-[rgba(125,211,252,0.13)] text-[var(--color-status-sky)]"
                      : "bg-white/[0.06] text-[var(--color-text-muted)]"
                  }`}
                >
                  {r.canal === "presencial" ? "Presencial" : "Online"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[12.5px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10.5px] text-[var(--color-text-muted)]">Data</span>
                  <span className="text-[var(--color-text-secondary)]">
                    {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10.5px] text-[var(--color-text-muted)]">Horário</span>
                  <span className="text-[var(--color-text-secondary)]">{r.horario?.slice(0, 5)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10.5px] text-[var(--color-text-muted)]">Pessoas</span>
                  <span className="text-[var(--color-text-secondary)]">{r.pessoas}</span>
                </div>
              </div>

              <div className="flex flex-col gap-0.5 text-[12.5px]">
                <span className="text-[10.5px] text-[var(--color-text-muted)]">Ocasião</span>
                <span className="truncate text-[var(--color-text-secondary)]">{r.objetivo || "—"}</span>
              </div>

              <div className="flex flex-col gap-0.5 text-[12.5px]">
                <span className="text-[10.5px] text-[var(--color-text-muted)]">Responsável</span>
                <span className="truncate text-[var(--color-text-secondary)]">{nomeResponsavel(r.responsavelUserId)}</span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                <StatusSelect reservaId={r.id} status={r.status} />
                <div className="flex items-center gap-2">
                  <ObservacaoPopup observacao={r.observacao} nome={r.nome} />
                  <ReservaDetalhesDialog reserva={r} responsavelNome={nomeResponsavel(r.responsavelUserId)} atendentes={atendentes} />
                  {r.status !== "cancelada" && <CancelarReservaButton reservaId={r.id} nome={r.nome} />}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: tabela com colunas redimensionáveis */}
      <div className="hidden w-full lg:block">
        <TabelaRedimensionavel tableId="reservas">
          <div className="w-full overflow-hidden rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)]">
            <div className="flex w-full items-center border-b border-[var(--color-border)] px-[18px] py-[9px] text-[12px] font-medium text-[var(--color-text-muted)]">
              <div className="flex flex-1 items-center gap-3">
                <Coluna id="cliente" defaultWidth={200} header>Cliente</Coluna>
                <Coluna id="telefone" defaultWidth={130} header>Telefone</Coluna>
                <Coluna id="data" defaultWidth={90} header>Data</Coluna>
                <Coluna id="horario" defaultWidth={70} header>Horário</Coluna>
                <Coluna id="pessoas" defaultWidth={60} header>Pessoas</Coluna>
                <Coluna id="ocasiao" defaultWidth={200} header>Ocasião</Coluna>
                <Coluna id="canal" defaultWidth={90} header>Canal</Coluna>
                <Coluna id="responsavel" defaultWidth={120} header>Responsável</Coluna>
                <Coluna id="status" defaultWidth={110} header>Status</Coluna>
              </div>
              <p className="w-[210px] shrink-0 border-l border-white/10 pl-4">Ações</p>
            </div>

            {reservas.length === 0 ? (
              <p className="px-[18px] py-10 text-center text-[13px] text-[var(--color-text-muted)]">
                Nenhuma reserva encontrada com esses filtros.
              </p>
            ) : (
              reservas.map((r) => (
                <div
                  key={r.id}
                  className="flex w-full items-center border-b border-white/5 px-[18px] py-3 text-[13px] last:border-0"
                >
                  <div className="flex flex-1 items-center gap-3">
                    <Coluna id="cliente" defaultWidth={200} className="truncate text-[var(--color-text-primary)]">
                      {r.nome}
                    </Coluna>
                    <Coluna id="telefone" defaultWidth={130} className="text-[var(--color-text-secondary)]">
                      {r.telefone}
                    </Coluna>
                    <Coluna id="data" defaultWidth={90} className="text-[var(--color-text-secondary)]">
                      {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")}
                    </Coluna>
                    <Coluna id="horario" defaultWidth={70} className="text-[var(--color-text-secondary)]">
                      {r.horario?.slice(0, 5)}
                    </Coluna>
                    <Coluna id="pessoas" defaultWidth={60} className="text-[var(--color-text-secondary)]">
                      {r.pessoas}
                    </Coluna>
                    <Coluna id="ocasiao" defaultWidth={200} className="truncate text-[var(--color-text-secondary)]">
                      {r.objetivo || "—"}
                    </Coluna>
                    <Coluna id="canal" defaultWidth={90}>
                      <span
                        className={`flex h-[20px] w-fit items-center rounded-[999px] px-[8px] text-[10.5px] font-medium ${
                          r.canal === "presencial"
                            ? "bg-[rgba(125,211,252,0.13)] text-[var(--color-status-sky)]"
                            : "bg-white/[0.06] text-[var(--color-text-muted)]"
                        }`}
                      >
                        {r.canal === "presencial" ? "Presencial" : "Online"}
                      </span>
                    </Coluna>
                    <Coluna id="responsavel" defaultWidth={120} className="truncate text-[var(--color-text-secondary)]">
                      {nomeResponsavel(r.responsavelUserId)}
                    </Coluna>
                    <Coluna id="status" defaultWidth={110}>
                      <StatusSelect reservaId={r.id} status={r.status} />
                    </Coluna>
                  </div>
                  <div className="flex w-[210px] shrink-0 items-center gap-2 border-l border-white/10 pl-4">
                    <ObservacaoPopup observacao={r.observacao} nome={r.nome} />
                    <ReservaDetalhesDialog reserva={r} responsavelNome={nomeResponsavel(r.responsavelUserId)} atendentes={atendentes} />
                    {r.status !== "cancelada" && <CancelarReservaButton reservaId={r.id} nome={r.nome} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabelaRedimensionavel>
      </div>

      <div className="flex w-full items-center justify-end gap-4 text-[13px] text-[var(--color-text-muted)]">
        <span>
          Mostrando {reservas.length} de {total}
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
