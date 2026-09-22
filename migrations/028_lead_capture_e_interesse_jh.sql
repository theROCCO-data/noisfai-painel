-- Duas features novas (22/09/2026), pedidos do Matheus:
--
-- TASK 1 — Salvar TODOS os dados do cliente, mesmo sem fechar reserva.
--   Hoje nome/email/CPF só entram em `clientes` quando a reserva é criada
--   (motor_reserva). RPC `upsert_cliente` grava/enriquece por telefone: o
--   agente do n8n chama assim que o cliente informa cada dado. Faz merge
--   (nunca apaga um campo já preenchido com um valor vazio) e não duplica
--   (update por telefone; insert só se não existir).
--
-- TASK 2 — Filtro automático "Jantar Harmonizado" nas Conversas.
--   Tabela `jantar_harmonizado_interesse`: 1 linha por telefone que
--   mencionou jantar harmonizado (flag permanente/fixo). Preenchida por um
--   branch no n8n (qualquer menção, mesmo sem edição ativa — decisão 2B). O
--   painel cruza com `reservas` (objetivo='Jantar Harmonizado' +
--   status_pagamento='confirmado') pra mostrar se já confirmou ou não.
--
-- Rodar com: MIGRATION_DB_PASSWORD="<senha>" node run-migration-chat-messages-028.mjs

-- TASK 1 -------------------------------------------------------------------
create or replace function public.upsert_cliente(
  p_telefone text,
  p_nome text default null,
  p_email text default null,
  p_cpf text default null
) returns void
language plpgsql
as $$
begin
  if p_telefone is null or length(trim(p_telefone)) = 0 then
    return;
  end if;

  update clientes set
    nome  = coalesce(nullif(trim(p_nome), ''),  nome),
    email = coalesce(nullif(trim(p_email), ''), email),
    cpf   = coalesce(nullif(trim(p_cpf), ''),   cpf)
  where telefone = p_telefone;

  if not found then
    insert into clientes (telefone, nome, email, cpf, created_at)
    values (
      p_telefone,
      nullif(trim(p_nome), ''),
      nullif(trim(p_email), ''),
      nullif(trim(p_cpf), ''),
      now()
    );
  end if;
end;
$$;

-- TASK 2 -------------------------------------------------------------------
create table if not exists public.jantar_harmonizado_interesse (
  telefone text primary key,
  created_at timestamptz not null default now()
);
alter table public.jantar_harmonizado_interesse enable row level security;
-- sem policy: só o service_role (painel server-side) lê/escreve; o navegador
-- não acessa a tabela direto (mesmo padrão de chat_messages).
