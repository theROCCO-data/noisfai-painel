-- Cache da foto de perfil do WhatsApp por conversa. Sem isso, mostrar a foto
-- na lista de Conversas (que fica sob auto-refresh de 4s) significaria bater
-- na Evolution API a cada poucos segundos por conversa aberta — aqui só
-- guardamos a URL e a hora da última busca; quem decide se está velha o
-- bastante pra buscar de novo é o código da tela, não o banco.
alter table public.chats
  add column if not exists foto_url text,
  add column if not exists foto_atualizada_em timestamptz;
