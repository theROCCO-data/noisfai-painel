-- FASE 3 do plano de persistência de mensagens (modelo Datanyx).
-- A constraint original só permitia image/audio/video em media_type, mas o
-- Painel já trata "document" (ver rotuloDeMidia em conversas.ts) e o cliente
-- pode mandar PDF/documento. Sem isto, o backfill/gravador rejeitava (erro
-- 23514) toda mensagem de documento -- ela sumia do histórico lido do banco.
-- Estende o domínio permitido pra incluir 'document'. Aditivo.
--
-- Rodar com: MIGRATION_DB_PASSWORD="<senha do postgres>" node run-migration-chat-messages-026.mjs

alter table chat_messages drop constraint if exists chat_messages_media_type_check;
alter table chat_messages add constraint chat_messages_media_type_check
  check (media_type is null or media_type = any (array['image','audio','video','document']));
