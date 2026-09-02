# Painel NOI

Painel administrativo do NOI São Francisco: reservas, conversas do WhatsApp
(atendidas pelo chatbot Nyx), clientes, capacidade, cardápio, iFood, Jantar
Harmonizado, análises e configurações de usuários. Next.js 16 (App Router) +
Supabase.

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Crie um `.env.local` na raiz com:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# servidor apenas — nunca prefixar com NEXT_PUBLIC_, nunca importar em Client Components
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=

# workflows-ponte no n8n (leem/escrevem o Redis de handoff bot/humano —
# mesma chave que o bot do WhatsApp usa)
N8N_STATUS_HUMANO_URL=
N8N_STATUS_HUMANO_TOKEN=
N8N_INICIAR_HUMANO_URL=
N8N_FINALIZAR_HUMANO_URL=
N8N_ENVIAR_MENSAGEM_URL=
N8N_PERFIL_WHATSAPP_URL=
```

No Vercel, essas mesmas chaves precisam ser configuradas em
**Project Settings → Environment Variables**.

## Migrações de banco

As migrações SQL ficam em `migrations/`. Pra rodar uma:

```bash
MIGRATION_DB_PASSWORD="senha do banco Postgres do Supabase" node scripts/run-migration.mjs
```

(o script lê a senha só da variável de ambiente — nunca fica salva em
arquivo). `scripts/check-status-col.mjs` é um utilitário parecido pra
inspecionar colunas/constraints direto no Postgres.

## Recriando os workflows-ponte do n8n

Os workflows que ligam o painel ao n8n (consulta de status humano/bot,
iniciar/devolver atendimento, envio de mensagem) foram criados uma vez via
API do n8n, usando os scripts `scripts/create-n8n-workflow.mjs`,
`scripts/create-n8n-controle-humano.mjs` e `scripts/create-n8n-workflow-envio.mjs`. Eles já
rodaram e os workflows já existem no n8n — só precisa rodar de novo se for
recriar o ambiente do zero (outra instância do n8n, por exemplo):

```bash
N8N_API_KEY="chave de API do n8n" N8N_STATUS_HUMANO_TOKEN="token combinado com o painel" node scripts/create-n8n-workflow.mjs
N8N_API_KEY="..." N8N_STATUS_HUMANO_TOKEN="..." node scripts/create-n8n-controle-humano.mjs
N8N_API_KEY="..." N8N_STATUS_HUMANO_TOKEN="..." node scripts/create-n8n-workflow-envio.mjs
```

Depois de criados, os workflows precisam ser **publicados** (Publish/Active)
no n8n pra responder no domínio público.

## Deploy

Publicado no [Vercel](https://vercel.com). Deploy automático a cada push na
branch principal.
