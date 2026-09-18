-- FASE 3 do plano de persistência de mensagens (modelo Datanyx).
-- Guarda o `key.remoteJid` cru de cada mensagem. Necessário pra remontar a
-- URL de proxy de mídia (`/api/evolution/midia?id&remoteJid&fromMe`) quando o
-- histórico passa a ser lido do banco em vez da Evolution ao vivo: a mídia do
-- cliente vem endereçada pelo LID (`@lid`), e o `getBase64FromMediaMessage`
-- da Evolution exige o remoteJid EXATO em que a mensagem foi armazenada --
-- o `phone` colapsado não serve. Puramente aditivo.
--
-- Rodar com: MIGRATION_DB_PASSWORD="<senha do postgres>" node run-migration-chat-messages-025.mjs

alter table chat_messages add column if not exists remote_jid text;
