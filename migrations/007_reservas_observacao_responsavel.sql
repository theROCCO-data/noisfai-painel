-- Observação livre da reserva (ex.: alergias, preferências) e quem é o
-- responsável por ela: um usuário do painel (atendente) ou o próprio bot
-- (responsavel_user_id null = "Chatbot IA", convenção usada no código, já
-- que toda reserva feita pelo bot não tem um usuário logado por trás).
alter table public.reservas
  add column if not exists observacao text,
  add column if not exists responsavel_user_id uuid references auth.users(id);
