-- Corrige ambiguidade de coluna em reservar_lugares(): a função RETURNS
-- TABLE(..., disponivel_atual integer) cria uma variável implícita
-- `disponivel_atual` dentro do corpo, que colide com a coluna
-- `capacidade_turno.disponivel_atual` no UPDATE. Nunca dava erro antes
-- porque nenhuma reserva real tinha passado por esse caminho ainda.
-- Único ajuste: qualificar a tabela com alias `ct` no UPDATE. Nenhuma
-- outra mudança de comportamento/assinatura — seguro para o bot (n8n)
-- que chama a mesma função hoje.
create or replace function public.reservar_lugares(p_capacidade_id bigint, p_pessoas integer)
 returns table(sucesso boolean, reservado_atual integer, disponivel_atual integer)
 language plpgsql
as $function$
declare
  v_capacidade int;
  v_reservado  int;
  v_disponivel int;
begin
  select capacidade_bot, reservado, capacidade_turno.disponivel_atual
    into v_capacidade, v_reservado, v_disponivel
  from public.capacidade_turno
  where id = p_capacidade_id
  for update;

  if not found then
    return query select false, 0, 0;
    return;
  end if;

  if v_disponivel < p_pessoas then
    return query select false, v_reservado, v_disponivel;
    return;
  end if;

  update public.capacidade_turno as ct
     set reservado = ct.reservado + p_pessoas,
         disponivel_atual = ct.disponivel_atual - p_pessoas
   where ct.id = p_capacidade_id;

  return query
    select true, (v_reservado + p_pessoas), (v_disponivel - p_pessoas);
end;
$function$
