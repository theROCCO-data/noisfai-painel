const N8N_URL = "https://subscription.noisf.tech/api/v1";
const API_KEY = process.env.N8N_API_KEY;
const TOKEN = process.env.N8N_STATUS_HUMANO_TOKEN;
if (!API_KEY || !TOKEN) {
  console.error("Defina N8N_API_KEY e N8N_STATUS_HUMANO_TOKEN antes de rodar.");
  process.exit(1);
}
const REDIS_CRED = { id: "OJSpGiJ3qcPhl3lg", name: "Redis - Subscription Noi SF" };

function baseNodes({ stickyContent, path, redisNode }) {
  return [
    {
      parameters: { content: stickyContent, height: 620, width: 620, color: 7 },
      type: "n8n-nodes-base.stickyNote",
      typeVersion: 1,
      position: [-880, -360],
      id: "sticky-1",
      name: "Sticky Note",
    },
    {
      parameters: { httpMethod: "POST", path, responseMode: "responseNode", options: {} },
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [-200, -160],
      id: "webhook-1",
      name: "Webhook - Controle",
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
              value: "={{ $json.body.telefone }}@s.whatsapp.net_block",
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
    { ...redisNode, position: [460, -280], id: "redis-op", name: redisNode.name },
    {
      parameters: {
        respondWith: "json",
        responseBody: '={{ { "ok": true } }}',
        options: {},
      },
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.4,
      position: [680, -280],
      id: "respond-200",
      name: "Responde OK",
    },
  ];
}

function connections(redisNodeName) {
  return {
    "Webhook - Controle": { main: [[{ node: "Valida Token", type: "main", index: 0 }]] },
    "Valida Token": {
      main: [
        [{ node: "Monta Chave Redis", type: "main", index: 0 }],
        [{ node: "Nega Acesso", type: "main", index: 0 }],
      ],
    },
    "Monta Chave Redis": { main: [[{ node: redisNodeName, type: "main", index: 0 }]] },
    [redisNodeName]: { main: [[{ node: "Responde OK", type: "main", index: 0 }]] },
  };
}

const workflows = [
  {
    name: "noisfAI - Inicia Atendimento Humano",
    nodes: baseNodes({
      path: "painel-iniciar-atendimento-humano",
      stickyContent:
        '# INICIA ATENDIMENTO HUMANO\n\n\n```\nCriado pro Painel NOI (Next.js) — botão "Iniciar Atendimento\nHumano" na tela de Conversas.\n\nSeta a MESMA chave Redis que o workflow principal\n("noisfAI - Atendimento WhatsApp NOI São Francisco") usa pra\npausar o bot ("{telefone}@s.whatsapp.net_block") — não cria\nlógica nova, só oferece um segundo jeito de acionar a mesma trava.\n\nTTL de 1h (3600s), igual ao node "Para o Agente" do workflow\nprincipal — mesma duração, pra não ter dois comportamentos de\npausa diferentes no sistema. Se ninguém devolver manualmente\n(botão "Devolver ao bot"), o bot volta sozinho depois de 1h.\n\nEntrada esperada (POST, JSON body):\n  { "telefone": "5521999999999" }\n\nHeader obrigatório:\n  x-painel-token: <mesmo token do workflow\n  "noisfAI - Consulta Status de Atendimento">\n\nSaída: { "ok": true }\n\n⚠️ Precisa estar Publicado (Publish/Active) pra responder no domínio\npúblico do n8n.\n\n```',
      redisNode: {
        parameters: {
          operation: "set",
          key: "={{ $json.chaveRedis }}",
          value: "true",
          keyType: "string",
          expire: true,
          ttl: 3600,
        },
        type: "n8n-nodes-base.redis",
        typeVersion: 1,
        name: "Seta Bloqueio",
        credentials: { redis: REDIS_CRED },
      },
    }),
    connections: connections("Seta Bloqueio"),
    settings: { executionOrder: "v1" },
  },
  {
    name: "noisfAI - Finaliza Atendimento Humano",
    nodes: baseNodes({
      path: "painel-finalizar-atendimento-humano",
      stickyContent:
        '# FINALIZA ATENDIMENTO HUMANO\n\n\n```\nCriado pro Painel NOI (Next.js) — botão "Devolver ao bot" na tela\nde Conversas.\n\nRemove a MESMA chave Redis que o workflow principal\n("noisfAI - Atendimento WhatsApp NOI São Francisco") usa pra\npausar o bot ("{telefone}@s.whatsapp.net_block") — equivalente a\nmandar "Atendimento finalizado" pelo WhatsApp, só que pelo painel.\n\nEntrada esperada (POST, JSON body):\n  { "telefone": "5521999999999" }\n\nHeader obrigatório:\n  x-painel-token: <mesmo token do workflow\n  "noisfAI - Consulta Status de Atendimento">\n\nSaída: { "ok": true }\n\n⚠️ Precisa estar Publicado (Publish/Active) pra responder no domínio\npúblico do n8n.\n\n```',
      redisNode: {
        parameters: { operation: "delete", key: "={{ $json.chaveRedis }}" },
        type: "n8n-nodes-base.redis",
        typeVersion: 1,
        name: "Remove Bloqueio",
        credentials: { redis: REDIS_CRED },
      },
    }),
    connections: connections("Remove Bloqueio"),
    settings: { executionOrder: "v1" },
  },
];

for (const wf of workflows) {
  const res = await fetch(`${N8N_URL}/workflows`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-N8N-API-KEY": API_KEY },
    body: JSON.stringify(wf),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error("ERRO em", wf.name, ":", res.status, JSON.stringify(json, null, 2));
    continue;
  }
  console.log("Criado:", json.id, json.name);
}
