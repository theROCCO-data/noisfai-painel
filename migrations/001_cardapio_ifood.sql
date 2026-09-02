-- Migração: cria cardapio_itens e ifood_itens, e migra os itens que hoje
-- só existem no RAG (`documents`, source='cardapio'/'ifood') pra tabelas
-- estruturadas que o painel administra.
--
-- Rodar uma vez no SQL Editor do Supabase (Project > SQL Editor > New query).
-- É seguro rodar mais de uma vez: usa "if not exists" e "on conflict do nothing".

create table if not exists public.cardapio_itens (
  id bigint generated always as identity primary key,
  codigo integer,
  categoria text not null,
  nome text not null,
  descricao text,
  preco numeric(10, 2) not null default 0,
  disponivel_presencial boolean not null default true,
  disponivel_ifood boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ifood_itens (
  id bigint generated always as identity primary key,
  categoria text not null,
  nome text not null,
  descricao text,
  preco numeric(10, 2) not null default 0,
  disponivel boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migra os 142 itens de cardápio hoje só no RAG (documents.metadata.source = 'cardapio')
insert into public.cardapio_itens (codigo, categoria, nome, descricao, preco, disponivel_presencial, disponivel_ifood)
select
  nullif(metadata->>'codigo', '')::integer,
  coalesce(metadata->>'categoria', 'Sem categoria'),
  metadata->>'prato',
  nullif(substring(content from 'Descrição: (.*?) \| Preço'), ''),
  coalesce(replace((regexp_match(content, 'Preço: (\d+(?:[.,]\d+)?)'))[1], ',', '.')::numeric, 0),
  true,
  false
from public.documents
where metadata->>'source' = 'cardapio'
  and metadata->>'prato' is not null
on conflict do nothing;

-- Migra os 194 itens de iFood hoje só no RAG (documents.metadata.source = 'ifood')
insert into public.ifood_itens (categoria, nome, descricao, preco, disponivel)
select
  coalesce(metadata->>'categoria', 'Sem categoria'),
  metadata->>'prato',
  nullif(substring(content from 'Descrição: (.*?) \| Preço'), ''),
  coalesce(replace((regexp_match(content, 'R\$ (\d+(?:[.,]\d+)?)'))[1], ',', '.')::numeric, 0),
  true
from public.documents
where metadata->>'source' = 'ifood'
  and metadata->>'prato' is not null
on conflict do nothing;
