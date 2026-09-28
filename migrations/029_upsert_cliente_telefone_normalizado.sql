-- 029: upsert_cliente passa a reconhecer o mesmo cliente com ou sem DDI.
-- Motivo: motor_reserva grava telefone sem 55 (ex.: 21999999999) e os fluxos de
-- captura gravam com 55 (5521999999999). Comparação exata criava cliente duplicado.
-- Agora compara pelos últimos 11 dígitos e mantém o formato já existente na linha.
-- Mesma regra de antes: campo novo só substitui quando vier preenchido.

create or replace function public.upsert_cliente(
  p_telefone text,
  p_nome text default null,
  p_email text default null,
  p_cpf text default null
) returns void
language plpgsql
as $$
declare
  v_chave text := right(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), 11);
begin
  if length(v_chave) < 10 then
    return;
  end if;

  update clientes set
    nome  = coalesce(nullif(trim(p_nome), ''),  nome),
    email = coalesce(nullif(trim(p_email), ''), email),
    cpf   = coalesce(nullif(trim(p_cpf), ''),   cpf)
  where right(regexp_replace(coalesce(telefone, ''), '\D', '', 'g'), 11) = v_chave;

  if not found then
    insert into clientes (telefone, nome, email, cpf, created_at)
    values (
      trim(p_telefone),
      nullif(trim(p_nome), ''),
      nullif(trim(p_email), ''),
      nullif(trim(p_cpf), ''),
      now()
    );
  end if;
end;
$$;
