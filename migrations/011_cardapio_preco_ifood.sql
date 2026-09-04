-- Preço alternativo pro iFood, usado só quando disponivel_ifood = true e o
-- valor no delivery é diferente do presencial. Sem FK pra ifood_itens: as
-- duas tabelas são independentes hoje (cardapio_itens é o cardápio
-- presencial, ifood_itens é o catálogo do RAG de delivery), não existe join
-- entre elas.

alter table cardapio_itens add column if not exists preco_ifood numeric;
