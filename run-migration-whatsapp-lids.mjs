// Cria a tabela `whatsapp_lids` -- guarda de forma permanente qual(is) LID
// (ID de privacidade do WhatsApp) ja foram vistos associados a cada
// telefone real. Achado em auditoria 16/09/2026: a Evolution as vezes
// "esquece" a entrada de um chat por LID na lista de conversas depois de
// um tempo (parece consolidar por tras dos panos), e as mensagens do
// cliente enviadas sob aquele LID somem da tela de Conversas do Painel --
// nao porque os dados sumiram de verdade (ainda dao pra recuperar
// consultando aquele LID especifico), mas porque o Painel so sabe quais
// LIDs consultar olhando a lista ATUAL de chats da Evolution.
//
// Rodar com: MIGRATION_DB_PASSWORD="<senha do postgres>" node run-migration-whatsapp-lids.mjs

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
create table if not exists whatsapp_lids (
  lid text primary key,
  telefone text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table whatsapp_lids enable row level security;
create index if not exists idx_whatsapp_lids_telefone on whatsapp_lids (telefone);
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
