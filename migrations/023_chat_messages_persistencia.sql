-- FASE 0 do plano de persistência de mensagens (modelo Datanyx).
-- Prepara a `chat_messages` (que já existe e já é gravada pelo n8n, mas de
-- forma incompleta) pra virar a fonte de verdade do histórico. Puramente
-- aditivo: nenhuma leitura usa isso ainda, comportamento atual inalterado.
--
-- Rodar com: MIGRATION_DB_PASSWORD="<senha do postgres>" node run-migration-chat-messages.mjs

-- 1) chave de deduplicação: o id real da mensagem na Evolution (key.id).
--    Hoje não existe -- `message_type` guarda só "messages.upsert" (o nome do
--    evento). Sem isso não dá pra deduplicar nem casar com o backfill.
alter table chat_messages add column if not exists message_id text;

-- 2) sentido da mensagem, explícito (key.fromMe). Hoje é inferido pelo par
--    bot_message/user_message; a coluna deixa determinístico e simples de ler.
alter table chat_messages add column if not exists from_me boolean;

-- 3) unicidade por message_id SÓ onde ele existe (índice parcial): permite as
--    linhas antigas (message_id nulo) conviverem, e impede duplicata nas
--    novas gravações e no backfill (upsert on_conflict=message_id do nothing).
create unique index if not exists uq_chat_messages_message_id
  on chat_messages (message_id) where message_id is not null;

-- 4) índices de leitura (thread por telefone e por conversa, em ordem cronológica).
create index if not exists idx_chat_messages_phone_created
  on chat_messages (phone, created_at);
create index if not exists idx_chat_messages_conversation_created
  on chat_messages (conversation_id, created_at);
