import { DatabaseZap } from "lucide-react";

export function BloqueioMigracao({ tabela, itensNoRag }: { tabela: string; itensNoRag: number }) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 rounded-[26px] border border-dashed border-[var(--color-border-soft)] p-12 text-center">
      <DatabaseZap size={28} className="text-[var(--color-accent)]" />
      <h2 className="font-display text-[18px] font-semibold text-[var(--color-text-primary)]">
        Falta rodar uma migração de banco antes desta tela funcionar
      </h2>
      <p className="max-w-[520px] text-[13px] leading-[1.6] text-[var(--color-text-muted)]">
        Essa tela depende da tabela <code className="rounded bg-white/10 px-1.5 py-0.5">{tabela}</code>, que ainda
        não existe no Supabase. A `service_role` key só dá acesso elevado ao que já existe no schema — criar
        tabela (DDL) precisa rodar no SQL Editor do projeto Supabase, ou de uma connection string direta do
        Postgres.
      </p>
      <p className="max-w-[520px] text-[13px] leading-[1.6] text-[var(--color-text-muted)]">
        O SQL já está pronto em <code className="rounded bg-white/10 px-1.5 py-0.5">migrations/001_cardapio_ifood.sql</code>{" "}
        — cria as tabelas e migra os {itensNoRag} itens que hoje só existem no RAG (`documents`). É só colar no
        SQL Editor do Supabase e rodar uma vez.
      </p>
    </div>
  );
}
