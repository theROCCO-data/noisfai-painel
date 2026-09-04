import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, Mail, IdCard, CalendarCheck, Wine, PartyPopper } from "lucide-react";
import { getClienteDetalhe } from "@/lib/data/clientes";
import { listEventosPorCliente } from "@/lib/data/eventos";
import { StatusBadge } from "@/components/ui/status-badge";
import { EditarClienteDialog } from "@/components/clientes/editar-cliente-dialog";

export const dynamic = "force-dynamic";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatData(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

export default async function ClienteDetalhePage({
  params,
}: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const clienteId = Number(id);
  if (!Number.isFinite(clienteId)) notFound();

  const [cliente, eventos] = await Promise.all([getClienteDetalhe(clienteId), listEventosPorCliente(clienteId)]);
  if (!cliente) notFound();

  const reservasHarmonizado = cliente.reservas.filter((r) => r.tipo === "harmonizado");
  const valorTotalHarmonizado = reservasHarmonizado
    .filter((r) => r.status !== "cancelado")
    .reduce((acc, r) => acc + (r.valorEstimado ?? 0), 0);

  return (
    <div className="flex w-full flex-col gap-6">
      <Link href="/clientes" className="flex w-fit items-center gap-1.5 text-[12.5px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
        <ArrowLeft size={14} />
        Voltar para clientes
      </Link>

      <div className="flex w-full flex-wrap items-center gap-5 rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-[22px]">
        <div className="flex size-[64px] shrink-0 items-center justify-center rounded-[16px] bg-[rgba(168,85,247,0.13)]">
          <User size={26} className="text-[#d8b4fe]" />
        </div>
        <div className="flex min-w-[220px] flex-1 flex-col gap-2.5">
          <p className="font-display text-[22px] font-semibold text-[var(--color-text-primary)]">{cliente.nome}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[12.5px] text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1.5">
              <Phone size={13} className="text-[var(--color-text-muted)]" />
              {cliente.telefone}
            </span>
            <span className="flex items-center gap-1.5">
              <IdCard size={13} className="text-[var(--color-text-muted)]" />
              {cliente.cpf ?? "CPF não informado"}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={13} className="text-[var(--color-text-muted)]" />
              {cliente.email ?? "E-mail não informado"}
            </span>
          </div>
          <p className="text-[11.5px] text-[var(--color-text-muted)]">
            Cliente desde {new Date(cliente.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex w-full gap-8 sm:w-auto">
          <div className="text-right">
            <p className="text-[12px] text-[var(--color-text-muted)]">Reservas</p>
            <p className="font-display text-[20px] text-[var(--color-text-primary)]">{cliente.totalReservas}</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-[var(--color-text-muted)]">Pessoas atendidas</p>
            <p className="font-display text-[20px] text-[var(--color-text-primary)]">{cliente.totalPessoasAtendidas}</p>
          </div>
          {reservasHarmonizado.length > 0 && (
            <div className="text-right">
              <p className="text-[12px] text-[var(--color-text-muted)]">Total Jantar Harmonizado (est.)</p>
              <p className="font-display text-[20px] text-[var(--color-text-primary)]">{formatBRL(valorTotalHarmonizado)}</p>
            </div>
          )}
        </div>
        <EditarClienteDialog cliente={cliente} />
      </div>

      <div className="w-full overflow-hidden rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)]">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-[18px] py-3">
          <CalendarCheck size={15} className="text-[var(--color-text-muted)]" />
          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Histórico de reservas</p>
        </div>
        {/* Mobile: lista de cartões — a tabela de colunas fixas não cabe numa tela pequena */}
        <div className="flex w-full flex-col gap-3 p-[14px] lg:hidden">
          {cliente.reservas.length === 0 ? (
            <p className="px-[4px] py-6 text-center text-[13px] text-[var(--color-text-muted)]">
              Esse cliente ainda não tem reservas registradas.
            </p>
          ) : (
            cliente.reservas.map((r) => (
              <div key={r.id} className="flex w-full flex-col gap-2 rounded-[16px] border border-white/5 bg-white/[0.02] p-4 text-[13px]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {r.tipo === "harmonizado" ? (
                      <span className="flex w-fit items-center gap-1.5 font-medium text-[var(--color-text-primary)]">
                        <Wine size={13} className="text-[#d8b4fe]" />
                        Jantar Harmonizado
                      </span>
                    ) : (
                      <span className="font-medium text-[var(--color-text-primary)]">Reserva</span>
                    )}
                    <p className="text-[12px] text-[var(--color-text-muted)]">
                      {formatData(r.data)} · {r.horario?.slice(0, 5)} · {r.pessoas} pessoa{r.pessoas === 1 ? "" : "s"}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
                  <span
                    className={`flex h-[20px] w-fit items-center rounded-[999px] px-[8px] text-[10.5px] font-medium ${
                      r.canal === "presencial"
                        ? "bg-[rgba(125,211,252,0.13)] text-[var(--color-status-sky)]"
                        : "bg-[rgba(168,85,247,0.13)] text-[#c4b5fd]"
                    }`}
                  >
                    {r.canal === "presencial" ? "Presencial" : "Online"}
                  </span>
                  <span className="text-[var(--color-text-secondary)]">
                    {r.valorEstimado !== null ? formatBRL(r.valorEstimado) : "—"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: tabela de colunas fixas */}
        <div className="hidden lg:block">
          <div className="flex w-full gap-3 border-b border-[var(--color-border)] px-[18px] py-[9px] text-[12px] font-medium text-[var(--color-text-muted)]">
            <p className="w-[110px]">Data</p>
            <p className="w-[70px]">Horário</p>
            <p className="w-[150px]">Tipo</p>
            <p className="w-[60px]">Pessoas</p>
            <p className="w-[90px]">Canal</p>
            <p className="w-[110px]">Status</p>
            <p className="flex-1">Valor (est.)</p>
          </div>

          {cliente.reservas.length === 0 ? (
            <p className="px-[18px] py-10 text-center text-[13px] text-[var(--color-text-muted)]">
              Esse cliente ainda não tem reservas registradas.
            </p>
          ) : (
            cliente.reservas.map((r) => (
              <div key={r.id} className="flex w-full items-center gap-3 border-b border-white/5 px-[18px] py-3 text-[13px] last:border-0">
                <p className="w-[110px] text-[var(--color-text-secondary)]">{formatData(r.data)}</p>
                <p className="w-[70px] text-[var(--color-text-secondary)]">{r.horario?.slice(0, 5)}</p>
                <div className="w-[150px]">
                  {r.tipo === "harmonizado" ? (
                    <span className="flex w-fit items-center gap-1.5 text-[var(--color-text-primary)]">
                      <Wine size={13} className="text-[#d8b4fe]" />
                      Jantar Harmonizado
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-secondary)]">Reserva</span>
                  )}
                </div>
                <p className="w-[60px] text-[var(--color-text-secondary)]">{r.pessoas}</p>
                <div className="w-[90px]">
                  <span
                    className={`flex h-[20px] w-fit items-center rounded-[999px] px-[8px] text-[10.5px] font-medium ${
                      r.canal === "presencial"
                        ? "bg-[rgba(125,211,252,0.13)] text-[var(--color-status-sky)]"
                        : "bg-[rgba(168,85,247,0.13)] text-[#c4b5fd]"
                    }`}
                  >
                    {r.canal === "presencial" ? "Presencial" : "Online"}
                  </span>
                </div>
                <div className="w-[110px]">
                  <StatusBadge status={r.status} />
                </div>
                <p className="flex-1 text-[var(--color-text-secondary)]">
                  {r.valorEstimado !== null ? formatBRL(r.valorEstimado) : "—"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {eventos.length > 0 && (
        <div className="w-full overflow-hidden rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)]">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-[18px] py-3">
            <PartyPopper size={15} className="text-[var(--color-text-muted)]" />
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Eventos</p>
          </div>
          <div className="flex w-full flex-col">
            {eventos.map((e) => (
              <div
                key={e.id}
                className="flex w-full flex-wrap items-center gap-3 border-b border-white/5 px-[18px] py-3 text-[13px] last:border-0"
              >
                <div className="flex min-w-[160px] flex-1 flex-col gap-0.5">
                  <p className="font-medium text-[var(--color-text-primary)]">{e.nomeEvento}</p>
                  {e.tipo && <p className="text-[11.5px] text-[var(--color-text-muted)]">{e.tipo}</p>}
                </div>
                <p className="text-[var(--color-text-secondary)]">
                  {formatData(e.data)}
                  {e.horario && ` às ${e.horario}`}
                </p>
                <p className="text-[var(--color-text-secondary)]">{e.pessoas} pessoas</p>
                {e.valor !== null && <p className="text-[var(--color-text-secondary)]">{formatBRL(e.valor)}</p>}
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
