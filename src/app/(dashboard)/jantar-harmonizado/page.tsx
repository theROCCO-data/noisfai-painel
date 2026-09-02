import { Wine, History } from "lucide-react";
import { getEdicaoJH, getPreReservasJH, listHistoricoJH } from "@/lib/data/jantar-harmonizado";
import { SectionCard } from "@/components/ui/section-card";
import { EditarEdicaoDialog } from "@/components/jantar-harmonizado/editar-edicao-dialog";
import { ListaPreReservas } from "@/components/jantar-harmonizado/lista-pre-reservas";
import { HistoricoEdicaoDialog } from "@/components/jantar-harmonizado/historico-edicao-dialog";

export const dynamic = "force-dynamic";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatData(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}
function formatDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default async function JantarHarmonizadoPage() {
  const [edicao, preReservas, historico] = await Promise.all([getEdicaoJH(), getPreReservasJH(), listHistoricoJH()]);
  const pendentes = preReservas.filter((p) => p.statusPagamento !== "confirmado");
  const confirmadas = preReservas.filter((p) => p.statusPagamento === "confirmado");

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
                <p className="font-display text-[16px] text-[var(--color-text-primary)]">{pendentes.length}</p>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <EditarEdicaoDialog edicao={edicao} trigger="Editar edição" modo="editar" />
            <EditarEdicaoDialog edicao={edicao} trigger="Nova edição" modo="nova" />
          </div>
        </div>
      )}

      <SectionCard icon={Wine} title="Reservas" className="w-full">
        <div className="flex items-center gap-2 px-[18px] pt-2">
          <span className="text-[11px] font-semibold tracking-[0.5px] text-[var(--color-text-muted)] uppercase">Pendentes</span>
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-[999px] bg-white/[0.06] px-[6px] text-[10.5px] font-semibold text-[var(--color-text-secondary)]">
            {pendentes.length}
          </span>
        </div>
        <ListaPreReservas
          tableId="jantar-harmonizado-prereservas"
          itens={pendentes}
          vazio="Nenhuma pré-reserva registrada ainda."
          mostrarConfirmar
        />

        <div className="mt-2 flex items-center gap-2 border-t border-white/5 px-[18px] pt-4">
          <span className="text-[11px] font-semibold tracking-[0.5px] text-[var(--color-text-muted)] uppercase">Confirmadas</span>
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-[999px] bg-white/[0.06] px-[6px] text-[10.5px] font-semibold text-[var(--color-text-secondary)]">
            {confirmadas.length}
          </span>
        </div>
        <ListaPreReservas
          tableId="jantar-harmonizado-confirmadas"
          itens={confirmadas}
          vazio="Nenhuma reserva confirmada por comprovante ainda."
          mostrarConfirmar={false}
        />
      </SectionCard>

      <SectionCard icon={History} title="Histórico de edições anteriores" className="w-full">
        {historico.length === 0 ? (
          <p className="px-[18px] py-8 text-center text-[13px] text-[var(--color-text-muted)]">
            Nenhuma edição anterior arquivada ainda — toda vez que a edição atual for atualizada, o estado
            anterior aparece aqui.
          </p>
        ) : (
          <div className="flex w-full flex-col gap-2 p-[14px]">
            {historico.map((h) => (
              <HistoricoEdicaoDialog key={h.id} edicao={h}>
                <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[14px] border border-white/5 bg-white/[0.02] px-4 py-3 text-[13px] hover:border-[rgba(168,85,247,0.3)] hover:bg-white/[0.04]">
                  <div className="flex flex-col gap-0.5">
                    <p className="font-medium text-[var(--color-text-primary)]">{h.titulo || "Sem nome"}</p>
                    <p className="text-[11.5px] text-[var(--color-text-muted)]">Arquivada em {formatDataHora(h.arquivadoEm)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[12.5px] text-[var(--color-text-secondary)]">
                    <span>Data: {formatData(h.dataEvento)}</span>
                    <span>Valor: {formatBRL(h.valorPessoa)}</span>
                    {h.cotaVagas !== null && <span>Cota: {h.cotaVagas} vagas</span>}
                  </div>
                </div>
              </HistoricoEdicaoDialog>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
