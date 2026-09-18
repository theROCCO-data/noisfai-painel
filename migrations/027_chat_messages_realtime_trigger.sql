-- FASE 4 do plano de persistência de mensagens (modelo Datanyx).
-- "Tempo real pela tabela": trigger AFTER INSERT na chat_messages que faz
-- broadcast no MESMO canal público que o painel já escuta
-- (`conversas`/`nova_mensagem`, ver auto-refresh.tsx). Dispara no COMMIT da
-- linha (preciso — sem a corrida do broadcast antigo do n8n, que disparava na
-- chegada do webhook, antes da mensagem existir no banco), e desacopla o
-- tempo real do node n8n `Notifica Painel (Realtime)`.
--
-- Decisões de segurança/robustez:
--  - NÃO mexe em RLS. `realtime.send(..., private => false)` publica num tópico
--    PÚBLICO (o painel já usa canal público), então não precisa de policy de
--    SELECT em chat_messages — o navegador continua SEM ler a tabela direto.
--  - SECURITY DEFINER: o trigger chama realtime.send independentemente do papel
--    que inseriu (service_role via PostgREST, etc.).
--  - EXCEPTION WHEN OTHERS: uma falha no broadcast JAMAIS pode abortar a
--    inserção da mensagem (o histórico é mais importante que a notificação).
--  - WHEN (message_id IS NOT NULL): só as linhas autoritativas (as que a
--    leitura mostra) notificam — evita disparo em dobro quando os gravadores
--    antigos inserem uma linha duplicada sem message_id.
--
-- Rodar com: MIGRATION_DB_PASSWORD="<senha do postgres>" node run-migration-chat-messages-027.mjs

create or replace function public.broadcast_nova_mensagem()
returns trigger
language plpgsql
security definer
set search_path = public, realtime
as $$
begin
  perform realtime.send(
    jsonb_build_object('phone', new.phone, 'message_id', new.message_id, 'from_me', new.from_me),
    'nova_mensagem',
    'conversas',
    false
  );
  return new;
exception when others then
  -- nunca deixa a notificação de tempo real quebrar a gravação da mensagem
  return new;
end;
$$;

drop trigger if exists trg_broadcast_nova_mensagem on chat_messages;
create trigger trg_broadcast_nova_mensagem
  after insert on chat_messages
  for each row
  when (new.message_id is not null)
  execute function public.broadcast_nova_mensagem();
