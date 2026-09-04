-- Favoritos de modelo de mensagem são por usuário — cada atendente marca os
-- seus próprios modelos mais usados, sem afetar o que os outros veem. Usado
-- só pra ordenar/destacar no seletor (ícone acima da caixa de digitar e no
-- dialog de Nova conversa), não muda o modelo em si.

create table if not exists modelos_mensagem_favoritos (
  user_id uuid not null,
  modelo_id bigint not null references modelos_mensagem(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, modelo_id)
);

alter table modelos_mensagem_favoritos enable row level security;
