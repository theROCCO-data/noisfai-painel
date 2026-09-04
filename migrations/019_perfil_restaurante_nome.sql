alter table configuracoes_painel
  add column if not exists nome text;

update configuracoes_painel set nome = 'NOI São Francisco' where id = 1 and nome is null;
