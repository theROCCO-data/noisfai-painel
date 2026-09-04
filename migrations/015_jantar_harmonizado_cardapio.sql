-- Cardápio do jantar harmonizado (menu degustação com as etapas e a
-- harmonização de vinho de cada uma), editável pela tela do Jantar
-- Harmonizado no Painel.
alter table eventos_especiais
  add column if not exists cardapio_intro text,
  add column if not exists cardapio_palestrante text,
  add column if not exists cardapio_etapas jsonb,
  add column if not exists hora_evento time;

alter table eventos_especiais_historico
  add column if not exists cardapio_intro text,
  add column if not exists cardapio_palestrante text,
  add column if not exists cardapio_etapas jsonb,
  add column if not exists hora_evento time;
