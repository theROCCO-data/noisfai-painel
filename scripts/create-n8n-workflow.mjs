const N8N_URL = "https://subscription.noisf.tech/api/v1";
const API_KEY = process.env.N8N_API_KEY;
const TOKEN = process.env.N8N_STATUS_HUMANO_TOKEN;
if (!API_KEY || !TOKEN) {
  console.error("Defina N8N_API_KEY e N8N_STATUS_HUMANO_TOKEN antes de rodar.");
  process.exit(1);
}

const workflow = {
  name: "noisfAI - Consulta Status de Atendimento",
  nodes: [
    {
      parameters: {
        content:
          "# CONSULTA STATUS DE ATENDIMENTO\n\n\n```\nCriado pro Painel NOI (Next.js) conseguir mostrar, em tempo real,\nse uma conversa está com o bot ou com um humano — sem duplicar nem\nmexer na lógica de bloqueio que já existe no workflow principal\n(\"noisfAI - Atendimento WhatsApp NOI São Francisco\").\n\nSó LÊ a mesma chave Redis que aquele workflow já usa\n(\"{telefone}@s.whatsapp.net_block\"). Não escreve nada, não afeta\no atendimento — é seguro rodar em paralelo.\n\nEntrada esperada (GET, querystring):\n  ?telefone=5521999999999\n\nHeader obrigatório:\n  x-painel-token: <token combinado com o painel, guardado em\n  .env.local do painel como N8N_STATUS_HUMANO_TOKEN>\n\nSaída: { \"humano\": true | false }\n\n⚠️ Precisa estar Publicado (Publish/Active) pra responder no domínio\npúblico do n8n — sem isso só funciona em execução manual/teste.\n\n```",
        height: 700,
        width: 620,
        color: 7,
      },
      type: "n8n-nodes-base.stickyNote",
      typeVersion: 1,
      position: [-880, -360],
      id: "sticky-1",
      name: "Sticky Note",
    },
    {
      parameters: {
        httpMethod: "GET",
        path: "painel-status-humano",
        responseMode: "responseNode",
        options: {},
      },
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [-200, -160],
      id: "webhook-1",
      name: "Webhook - Consulta Status",
    },
    {
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "strict", version: 1 },
          conditions: [
            {
              id: "cond-token",
              leftValue: "={{ $json.headers['x-painel-token'] }}",
              rightValue: TOKEN,
              operator: { type: "string", operation: "equals" },
            },
          ],
          combinator: "and",
        },
        options: {},
      },
      type: "n8n-nodes-base.if",
      typeVersion: 2.2,
      position: [20, -160],
      id: "if-token",
      name: "Valida Token",
    },
    {
      parameters: {
        respondWith: "json",
        responseBody: '={{ { "erro": "token inválido" } }}',
        options: { responseCode: 401 },
      },
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.4,
      position: [240, 40],
      id: "respond-401",
      name: "Nega Acesso",
    },
    {
      parameters: {
        assignments: {
          assignments: [
            {
              id: "assign-key",
              name: "chaveRedis",
              value: "={{ $json.query.telefone }}@s.whatsapp.net_block",
              type: "string",
            },
          ],
        },
        options: {},
      },
      type: "n8n-nodes-base.set",
      typeVersion: 3.5,
      position: [240, -280],
      id: "set-chave",
      name: "Monta Chave Redis",
    },
    {
      parameters: {
        operation: "get",
        propertyName: "block",
        key: "={{ $json.chaveRedis }}",
        options: {},
      },
      type: "n8n-nodes-base.redis",
      typeVersion: 1,
      position: [460, -280],
      id: "redis-get",
      name: "Busca Bloqueio",
      credentials: { redis: { id: "OJSpGiJ3qcPhl3lg", name: "Redis - Subscription Noi SF" } },
      alwaysOutputData: true,
    },
    {
      parameters: {
        respondWith: "json",
        responseBody: '={{ { "humano": $json.block === "true" } }}',
        options: {},
      },
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.4,
      position: [680, -280],
      id: "respond-200",
      name: "Responde Status",
    },
  ],
  connections: {
    "Webhook - Consulta Status": { main: [[{ node: "Valida Token", type: "main", index: 0 }]] },
    "Valida Token": {
      main: [
        [{ node: "Monta Chave Redis", type: "main", index: 0 }],
        [{ node: "Nega Acesso", type: "main", index: 0 }],
      ],
    },
    "Monta Chave Redis": { main: [[{ node: "Busca Bloqueio", type: "main", index: 0 }]] },
    "Busca Bloqueio": { main: [[{ node: "Responde Status", type: "main", index: 0 }]] },
  },
  settings: { executionOrder: "v1" },
};

const res = await fetch(`${N8N_URL}/workflows`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-N8N-API-KEY": API_KEY },
  body: JSON.stringify(workflow),
});

const json = await res.json();
if (!res.ok) {
  console.error("ERRO:", res.status, JSON.stringify(json, null, 2));
  process.exit(1);
}
console.log("Workflow criado:", json.id, json.name);
