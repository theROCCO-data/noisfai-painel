import { getCurrentStaffUser } from "@/lib/auth";
import { listUsuarios } from "@/lib/data/usuarios";
import { PerfilForm } from "@/components/configuracoes/perfil-form";
import { ConvidarUsuarioDialog } from "@/components/configuracoes/convidar-usuario-dialog";
import { SairButton } from "@/components/configuracoes/sair-button";
import { TabelaRedimensionavel, Coluna } from "@/components/ui/tabela-redimensionavel";
import { RemoverUsuarioButton } from "@/components/configuracoes/remover-usuario-button";
import { AlternarAcessoButton } from "@/components/configuracoes/alternar-acesso-button";

export const dynamic = "force-dynamic";

const CARGOS_PODEM_REMOVER = ["desenvolvedor", "proprietário", "proprietario", "gerente"];

export default async function ConfiguracoesPage() {
  const [user, usuarios] = await Promise.all([getCurrentStaffUser(), listUsuarios()]);
  const podeRemover = !!user && CARGOS_PODEM_REMOVER.includes(user.role.toLowerCase());

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-[28px] font-semibold text-[var(--color-text-primary)]">Configurações</h1>

      <div className="w-full rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)]">
        <div className="border-b border-[var(--color-border)] px-[18px] py-[14px]">
          <h2 className="font-display text-[16px] font-semibold text-[var(--color-text-primary)]">Meu perfil</h2>
        </div>
        <div className="px-[18px] py-5">
          <PerfilForm
            nome={user?.name ?? ""}
            cargo={user?.role ?? ""}
            email={user?.email ?? ""}
            avatarUrl={user?.avatarUrl ?? null}
          />
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-[18px] py-[14px]">
          <h2 className="font-display text-[16px] font-semibold text-[var(--color-text-primary)]">Usuários e permissões</h2>
          {podeRemover && <ConvidarUsuarioDialog />}
        </div>

        {/* Mobile: lista de cartões — a tabela de colunas fixas não cabe numa tela pequena */}
        <div className="flex w-full flex-col gap-3 p-[14px] lg:hidden">
          {usuarios.map((u) => (
            <div key={u.id} className="flex w-full flex-col gap-2 rounded-[16px] border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">{u.nome}</p>
                  <p className="truncate text-[12.5px] text-[var(--color-text-secondary)]">{u.email}</p>
                </div>
                {podeRemover && u.id !== user?.id && (
                  <div className="flex shrink-0 items-center gap-1">
                    <AlternarAcessoButton id={u.id} nome={u.nome} ativo={u.ativo} />
                    <RemoverUsuarioButton id={u.id} nome={u.nome} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-[999px] bg-[rgba(168,85,247,0.16)] px-[10px] py-1 text-[11px] font-semibold text-[#d8b4fe]">
                  {u.cargo}
                </span>
                <span className="flex items-center gap-1.5 text-[12px]">
                  <span
                    className={`size-[6px] rounded-full ${u.ativo ? "bg-[var(--color-status-green)]" : "bg-[var(--color-status-amber)]"}`}
                  />
                  <span className={u.ativo ? "text-[var(--color-status-green)]" : "text-[var(--color-status-amber)]"}>
                    {u.ativo ? "Ativo" : "Desativado"}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: tabela com colunas redimensionáveis */}
        <div className="hidden w-full lg:block">
          <TabelaRedimensionavel tableId="configuracoes-usuarios">
            <div className="flex w-full items-center gap-3 px-[18px] py-[9px] text-[12px] font-medium text-[var(--color-text-muted)]">
              <Coluna id="nome" defaultWidth={280} header>Nome</Coluna>
              <Coluna id="email" defaultWidth={220} header>E-mail</Coluna>
              <Coluna id="cargo" defaultWidth={110} header>Cargo</Coluna>
              <Coluna id="status" defaultWidth={90} header>Status</Coluna>
              {podeRemover && (
                <p className="w-[100px] shrink-0 border-l border-white/10 pl-4">Ações</p>
              )}
            </div>
            {usuarios.map((u) => (
              <div key={u.id} className="flex w-full items-center gap-3 border-t border-white/5 px-[18px] py-3 text-[13px]">
                <Coluna id="nome" defaultWidth={280} className="text-[var(--color-text-primary)]">
                  {u.nome}
                </Coluna>
                <Coluna id="email" defaultWidth={220} className="text-[var(--color-text-secondary)]">
                  {u.email}
                </Coluna>
                <Coluna id="cargo" defaultWidth={110}>
                  <span className="rounded-[999px] bg-[rgba(168,85,247,0.16)] px-[10px] py-1 text-[11px] font-semibold text-[#d8b4fe]">
                    {u.cargo}
                  </span>
                </Coluna>
                <Coluna id="status" defaultWidth={90} className="flex items-center gap-1.5">
                  <span
                    className={`size-[6px] rounded-full ${u.ativo ? "bg-[var(--color-status-green)]" : "bg-[var(--color-status-amber)]"}`}
                  />
                  <span className={u.ativo ? "text-[var(--color-status-green)]" : "text-[var(--color-status-amber)]"}>
                    {u.ativo ? "Ativo" : "Desativado"}
                  </span>
                </Coluna>
                {podeRemover && (
                  <div className="flex w-[100px] shrink-0 items-center gap-1 border-l border-white/10 pl-4">
                    {u.id !== user?.id && (
                      <>
                        <AlternarAcessoButton id={u.id} nome={u.nome} ativo={u.ativo} />
                        <RemoverUsuarioButton id={u.id} nome={u.nome} />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </TabelaRedimensionavel>
        </div>
      </div>

      <SairButton />
    </div>
  );
}
