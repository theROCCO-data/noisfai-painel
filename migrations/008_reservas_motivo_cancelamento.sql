-- Motivo do cancelamento, preenchido opcionalmente pelo atendente ao
-- cancelar uma reserva manualmente pelo painel (bot não usa esse campo).
alter table public.reservas
  add column if not exists motivo_cancelamento text;
