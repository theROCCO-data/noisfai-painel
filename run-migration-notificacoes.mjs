// Cria as 2 tabelas novas pras funcionalidades de "nao lida" e "confirmacao
// do gerente" no Painel NOI. DDL exige conexao direta Postgres (a
// service_role key nao cria tabela) -- mesmo padrao ja usado nas migracoes
// anteriores do projeto.
//
// Rodar com: MIGRATION_DB_PASSWORD="<senha do postgres>" node run-migration-notificacoes.mjs

import pg from "pg";

const PASSWORD = process.env.MIGRATION_DB_PASSWORD;
if (!PASSWORD) {
  console.error("Defina MIGRATION_DB_PASSWORD no ambiente antes de rodar.");
  process.exit(1);
}

const client = new pg.Client({
  host: "db.bvydxgjotxxkkszubvbx.supabase.co",
  port: 5432,
  user: "postgres",
  password: PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const SQL = `
create table if not exists conversas_leitura (
  telefone text primary key,
  lida_em timestamptz not null default now()
);
alter table conversas_leitura enable row level security;

create table if not exists confirmacoes_gerente (
  id bigint generated always as identity primary key,
  telefone text not null,
  tipo text not null check (tipo in ('grupo_grande', 'pagamento_jantar_harmonizado')),
  detalhe text,
  status text not null default 'pendente' check (status in ('pendente', 'confirmado')),
  criado_em timestamptz not null default now(),
  confirmado_em timestamptz,
  confirmado_por text
);
alter table confirmacoes_gerente enable row level security;
create index if not exists idx_confirmacoes_gerente_telefone_status
  on confirmacoes_gerente (telefone, status);
`;

try {
  await client.connect();
  await client.query(SQL);
  console.log("Migração aplicada com sucesso.");
} catch (err) {
  console.error("Erro:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
