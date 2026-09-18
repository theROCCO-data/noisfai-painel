// FASE 0 — persistência de mensagens (modelo Datanyx). Adiciona message_id +
// from_me + índices na `chat_messages`. Aditivo e reversível, não muda o
// comportamento atual (nenhuma leitura usa isso ainda).
//
// Rodar com: MIGRATION_DB_PASSWORD="<senha do postgres>" node run-migration-chat-messages.mjs

import pg from "pg";
import fs from "fs";

const PASSWORD = process.env.MIGRATION_DB_PASSWORD;
if (!PASSWORD) {
  console.error("Defina MIGRATION_DB_PASSWORD no ambiente antes de rodar.");
  process.exit(1);
}

const SQL = fs.readFileSync(new URL("./migrations/023_chat_messages_persistencia.sql", import.meta.url), "utf8");

const client = new pg.Client({
  host: "db.bvydxgjotxxkkszubvbx.supabase.co",
  port: 5432,
  user: "postgres",
  password: PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(SQL);
  // confirma o que ficou
  const cols = await client.query(
    "select column_name from information_schema.columns where table_name='chat_messages' and column_name in ('message_id','from_me') order by column_name"
  );
  const idx = await client.query(
    "select indexname from pg_indexes where tablename='chat_messages' and indexname in ('uq_chat_messages_message_id','idx_chat_messages_phone_created','idx_chat_messages_conversation_created') order by indexname"
  );
  console.log("Migração aplicada com sucesso.");
  console.log("colunas novas:", cols.rows.map((r) => r.column_name).join(", ") || "(nenhuma?)");
  console.log("índices novos:", idx.rows.map((r) => r.indexname).join(", ") || "(nenhum?)");
} catch (err) {
  console.error("Erro:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
