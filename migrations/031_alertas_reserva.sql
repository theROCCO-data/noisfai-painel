-- 031: registro dos alertas de "reserva pela metade" enviados ao grupo da equipe.
-- O workflow n8n "Alerta de Reserva pela Metade" roda a cada 5 min, acha conversas
-- que começaram uma reserva e pararam há 10+ min sem registro, e avisa o grupo.
-- Esta tabela impede alerta repetido: um por (telefone, última mensagem da parada).

create table if not exists public.alertas_reserva (
  id bigint generated always as identity primary key,
  telefone text not null,
  ultima_msg_em timestamptz not null,
  motivo text,
  resumo text,
  criado_em timestamptz not null default now(),
  unique (telefone, ultima_msg_em)
);

alter table public.alertas_reserva enable row level security;
