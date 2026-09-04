-- Reorganização do "Perfil do restaurante": os campos fixos de identidade
-- (endereço, telefone, site, etc.) passam a viver em configuracoes_painel
-- (linha única) em vez de serem só mais uma linha genérica em
-- perfil_restaurante. O que é específico de uma tela (regra de pagamento do
-- Jantar Harmonizado, info do espaço de Eventos) migra pra perto de onde é
-- usado, em vez de ficar solto num perfil genérico.
alter table configuracoes_painel
  add column if not exists endereco text,
  add column if not exists telefone text,
  add column if not exists horario_funcionamento text,
  add column if not exists sobre text,
  add column if not exists site_url text,
  add column if not exists ifood_url text,
  add column if not exists cardapio_digital_url text,
  add column if not exists outras_unidades text,
  add column if not exists espaco_eventos_info text;

alter table eventos_especiais
  add column if not exists regras_reserva text;
alter table eventos_especiais_historico
  add column if not exists regras_reserva text;
