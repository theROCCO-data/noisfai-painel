-- Tabela de configurações gerais do painel (linha única, id sempre 1).
-- Guarda coisas globais que não pertencem a nenhuma entidade de negócio
-- específica, como a logo customizada da sidebar.
create table if not exists public.configuracoes_painel (
  id integer primary key default 1,
  logo_url text,
  updated_at timestamptz not null default now(),
  constraint linha_unica check (id = 1)
);

insert into public.configuracoes_painel (id) values (1)
on conflict (id) do nothing;
