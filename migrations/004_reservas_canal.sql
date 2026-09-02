-- Origem da reserva: se veio do bot (WhatsApp/"online") ou foi lançada
-- manualmente no balcão pelo painel ("presencial"). Permite o painel também
-- servir como ferramenta de registro de reservas presenciais, não só espelho
-- do bot. Default 'online' porque as reservas já existentes (e as futuras
-- vindas do n8n, que não sabe desse campo) representam o fluxo original do bot;
-- o painel passa a marcar 'presencial' explicitamente ao criar pelo formulário.
alter table public.reservas
  add column if not exists canal text not null default 'online'
  check (canal in ('online', 'presencial'));
