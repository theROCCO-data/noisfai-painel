-- Trava leitura/escrita pública em cardapio_itens e ifood_itens.
-- Achado em auditoria: a chave anon (pública, embutida no bundle do
-- cliente) conseguia ler as duas tabelas inteiras sem nenhuma
-- restrição — RLS nunca tinha sido habilitado nelas. O Painel acessa
-- essas tabelas só via service_role (que ignora RLS), então habilitar
-- sem nenhuma policy pra anon/authenticated não quebra nada do
-- Painel — só fecha o acesso direto via API REST do Supabase.

alter table cardapio_itens enable row level security;
alter table ifood_itens enable row level security;
