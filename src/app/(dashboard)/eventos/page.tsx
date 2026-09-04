import Link from "next/link";
import { PartyPopper, Search, Users, Info } from "lucide-react";
import { listEventos } from "@/lib/data/eventos";
import { getConfiguracoes } from "@/lib/data/configuracoes";
import { NovaEventoDialog } from "@/components/eventos/nova-evento-dialog";
import { EventoStatusSelect } from "@/components/eventos/evento-status-select";
import { EditarInfoEspacoDialog } from "@/components/eventos/editar-info-espaco-dialog";

export const dynamic = "force-dynamic";

function formatData(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}
function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function EventosPage({ searchParams }: PageProps<"/eventos">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;

  const [eventos, config] = await Promise.all([listEventos({ q, status }), getConfiguracoes()]);

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] font-semibold text-[var(--color-text-primary)]">Eventos</h1>
          <p className="text-[11.5px] text-[var(--color-text-muted)]">Reservas do espaço de eventos, vinculadas a clientes.</p>
        </div>
        <NovaEventoDialog />
      </header>

      <div className="flex w-full items-start gap-3 rounded-[18px] border border-[var(--color-border-soft)] bg-white/[0.02] p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-[var(--color-text-muted)]" />
        <p className="flex-1 text-[12.5px] leading-[1.6] text-[var(--color-text-secondary)]">
          {config.espacoEventosInfo ?? "Nenhuma informação sobre o espaço cadastrada ainda."}
        </p>
        <EditarInfoEspacoDialog infoAtual={config.espacoEventosInfo} />
      </div>

      <form className="flex w-full flex-wrap items-center gap-3" action="/eventos">
        <div className="flex h-[34px] w-full items-center gap-2 rounded-[10px] border border-[var(--color-border-soft)] bg-white/[0.03] px-3 sm:w-[280px]">
          <Search size={14} className="text-[var(--color-text-muted)]" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar cliente ou evento"
            className="w-full bg-transparent text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />
        </div>
        <div className="flex h-[34px] items-center gap-1 rounded-[10px] border border-[var(--color-border-soft)] bg-white/[0.03] p-[3px] text-[12.5px]">
          {[
            { value: "", label: "Todos" },
            { value: "pendente", label: "Pendente" },
            { value: "confirmado", label: "Confirmado" },
            { value: "cancelado", label: "Cancelado" },
          ].map((opt) => (
            <Link
              key={opt.value}
              href={`/eventos?${new URLSearchParams({ ...(q ? { q } : {}), ...(opt.value ? { status: opt.value } : {}) }).toString()}`}
              className={`flex h-[26px] items-center rounded-[7px] px-3 font-medium ${
                (status ?? "") === opt.value
                  ? "bg-white/[0.08] text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
        <button
          type="submit"
          className="h-[34px] shrink-0 rounded-[10px] border border-[var(--color-border-soft)] px-4 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-white/[0.03]"
        >
          Filtrar
        </button>
      </form>

      {eventos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] px-[18px] py-12 text-center">
          <PartyPopper size={22} className="text-[var(--color-text-muted)]" />
          <p className="text-[13px] text-[var(--color-text-muted)]">
            {q || status ? "Nenhum evento encontrado com esse filtro." : "Nenhum evento cadastrado ainda."}
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-3">
          {eventos.map((e) => (
            <div
              key={e.id}
              className="flex w-full flex-wrap items-center gap-4 rounded-[20px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-4"
            >
              <div className="flex size-[46px] shrink-0 items-center justify-center rounded-[14px] bg-white/[0.04]">
                <PartyPopper size={18} className="text-[var(--color-text-secondary)]" />
              </div>
              <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
                <p className="text-[14.5px] font-semibold text-[var(--color-text-primary)]">{e.nomeEvento}</p>
                <Link href={`/clientes/${e.clienteId}`} className="text-[12.5px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
                  {e.clienteNome} · {e.clienteTelefone}
                </Link>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10.5px] text-[var(--color-text-muted)]">Data</span>
                <span className="text-[13px] text-[var(--color-text-primary)]">
                  {formatData(e.data)}
                  {e.horario && ` às ${e.horario}`}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10.5px] text-[var(--color-text-muted)]">Pessoas</span>
                <span className="flex items-center gap-1 text-[13px] text-[var(--color-text-primary)]">
                  <Users size={12} className="text-[var(--color-text-muted)]" />
                  {e.pessoas}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10.5px] text-[var(--color-text-muted)]">Espaço</span>
                <span className="text-[13px] text-[var(--color-text-primary)]">{e.espaco}</span>
              </div>
              {e.tipo && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10.5px] text-[var(--color-text-muted)]">Tipo</span>
                  <span className="text-[13px] text-[var(--color-text-primary)]">{e.tipo}</span>
                </div>
              )}
              {e.valor !== null && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10.5px] text-[var(--color-text-muted)]">Valor</span>
                  <span className="text-[13px] text-[var(--color-text-primary)]">{formatBRL(e.valor)}</span>
                </div>
              )}
              <div className="ml-auto shrink-0">
                <EventoStatusSelect eventoId={e.id} status={e.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
