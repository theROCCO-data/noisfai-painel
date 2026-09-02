-- Campo de exibição da edição atual do Jantar Harmonizado, separado do
-- `nome` (que é o identificador fixo do TIPO de evento, "Jantar Harmonizado",
-- e tem constraint unique — não pode virar "Edição de setembro" sem quebrar
-- o resto do sistema que filtra por esse nome fixo).
alter table public.eventos_especiais
  add column if not exists titulo text;
