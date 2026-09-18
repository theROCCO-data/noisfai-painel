-- FASE 1 (ajuste) — troca o índice único parcial de message_id por um índice
-- único SIMPLES. Motivo: o PostgREST (usado pelo upsert `on_conflict=message_id`
-- na ingestão do n8n) não casa de forma confiável com índice parcial. O
-- Postgres permite múltiplos NULLs num índice único (NULLs são distintos),
-- então as ~1.288 linhas antigas (message_id nulo) continuam convivendo sem
-- problema, e a unicidade vale só pros message_id reais (não nulos).
--
-- Rodar com: MIGRATION_DB_PASSWORD="<senha>" node run-migration-chat-messages-024.mjs

drop index if exists uq_chat_messages_message_id;
create unique index if not exists uq_chat_messages_message_id
  on chat_messages (message_id);
