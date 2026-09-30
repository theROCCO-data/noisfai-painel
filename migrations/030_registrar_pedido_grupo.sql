-- 030: pedido de grupo grande (acima de 10 pessoas) vira registro no banco.
-- Antes: o bot só avisava o gerente e nada era gravado (nem cliente, nem pedido).
-- Agora: grava/enriquece o cliente (upsert_cliente) e cria o pedido em
-- eventos_reservas com status 'pendente', que aparece na tela Eventos pro
-- gerente confirmar ou cancelar. Mesmo cliente + mesma data com pedido não
-- cancelado = atualiza o pedido existente em vez de duplicar.

create or replace function public.registrar_pedido_grupo(
  p_telefone text,
  p_nome text default null,
  p_email text default null,
  p_cpf text default null,
  p_data date default null,
  p_horario time default null,
  p_pessoas integer default null,
  p_ocasiao text default null,
  p_observacao text default null
) returns bigint
language plpgsql
as $$
declare
  v_chave text := right(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), 11);
  v_cliente bigint;
  v_evento bigint;
begin
  if length(v_chave) < 10 or p_data is null then
    return null;
  end if;

  perform public.upsert_cliente(p_telefone, p_nome, p_email, p_cpf);

  select id into v_cliente from clientes
   where right(regexp_replace(coalesce(telefone, ''), '\D', '', 'g'), 11) = v_chave
   order by id limit 1;

  select id into v_evento from eventos_reservas
   where cliente_id = v_cliente and data = p_data and status <> 'cancelado'
   order by id limit 1;

  if v_evento is not null then
    update eventos_reservas set
      horario = coalesce(p_horario, horario),
      pessoas = coalesce(p_pessoas, pessoas),
      nome_evento = coalesce(nullif(trim(p_ocasiao), ''), nome_evento),
      observacao = coalesce(nullif(trim(p_observacao), ''), observacao)
    where id = v_evento;
    return v_evento;
  end if;

  insert into eventos_reservas (cliente_id, nome_evento, tipo, data, horario, pessoas, espaco, observacao, status)
  values (
    v_cliente,
    coalesce(nullif(trim(p_ocasiao), ''), 'Grupo grande'),
    'grupo_grande',
    p_data,
    p_horario,
    coalesce(p_pessoas, 10),
    'A definir',
    coalesce(nullif(trim(p_observacao), ''), 'Pedido recebido pelo WhatsApp (assistente virtual). Confirmar com o cliente.'),
    'pendente'
  )
  returning id into v_evento;
  return v_evento;
end;
$$;
