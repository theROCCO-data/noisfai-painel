-- Cache de foto de perfil do WhatsApp (Evolution API), por telefone.
-- Substitui `chats.foto_url`/`foto_atualizada_em` agora que a leitura de
-- Conversas não depende mais de `chats` — evita bater na Evolution a cada
-- refresh de 5s da thread aberta (cache de 24h, mesmo TTL de antes).

create table if not exists whatsapp_perfis (
  telefone text primary key,
  foto_url text null,
  atualizada_em timestamptz not null default now()
);

alter table whatsapp_perfis enable row level security;
