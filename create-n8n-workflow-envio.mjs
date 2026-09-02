const N8N_URL = "https://subscription.noisf.tech/api/v1";
const API_KEY = process.env.N8N_API_KEY;
// mesmo token já usado nos 2 webhooks de controle de atendimento humano
// (N8N_STATUS_HUMANO_TOKEN no .env.local do painel) — segredo compartilhado
// entre todos os webhooks-ponte painel -> n8n.
const TOKEN = process.env.N8N_STATUS_HUMANO_TOKEN;
if (!API_KEY || !TOKEN) {
  console.error("Defina N8N_API_KEY e N8N_STATUS_HUMANO_TOKEN antes de rodar.");
  process.exit(1);
}
const INSTANCE_NAME = "RoccoIA";

const workflow = {
  name: "noisfAI - Envio de Mensagem via Painel",
  nodes: [
    {
      parameters: {
        content:
          "# ENVIO DE MENSAGEM VIA PAINEL\n\n\n```\nPermite que o Painel NOI (Next.js) mande uma mensagem de WhatsApp\npra um cliente diretamente (Composer da tela de Conversas), sem\npassar pelo agente Nyx.\n\nEntrada esperada (POST, JSON):\n  { \"telefone\": \"5521999999999\", \"mensagem\": \"texto aqui\" }\n\n(telefone pode vir com ou sem o sufixo @s.whatsapp.net)\n\nHeader obrigatório:\n  x-painel-token: <mesmo token dos webhooks de atendimento humano,\n  guardado em .env.local do painel>\n\nSaída: { \"ok\": true }\n\nUsa a MESMA credencial Evolution API (\"Evolution - Subscription Noi\nSF\") e o mesmo node/resource (messages-api) já usados pelo workflow\nprincipal de atendimento — só que aqui o instanceName é fixo\n(\"RoccoIA\"), informado pelo usuário, já que não existe payload de\nwebhook recebido nesse fluxo pra ler o instance dinamicamente.\n\n⚠️ Precisa estar Publicado (Publish/Active) pra responder no domínio\npúblico do n8n.\n\n```",
        height: 620,
        width: 640,
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
        httpMethod: "POST",
        path: "painel-enviar-mensagem",
        responseMode: "responseNode",
        options: {},
      },
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [-200, -160],
      id: "webhook-1",
      name: "Webhook - Enviar Mensagem",
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
              id: "assign-jid",
              name: "remoteJid",
              value:
                "={{ $json.body.telefone.includes('@') ? $json.body.telefone : $json.body.telefone + '@s.whatsapp.net' }}",
              type: "string",
            },
            {
              id: "assign-msg",
              name: "mensagem",
              value: "={{ $json.body.mensagem }}",
              type: "string",
            },
          ],
        },
        options: {},
      },
      type: "n8n-nodes-base.set",
      typeVersion: 3.5,
      position: [240, -280],
      id: "set-dados",
      name: "Monta Dados",
    },
    {
      parameters: {
        resource: "messages-api",
        instanceName: INSTANCE_NAME,
        remoteJid: "={{ $json.remoteJid }}",
        messageText: "={{ $json.mensagem }}",
        options_message: {},
      },
      type: "n8n-nodes-evolution-api.evolutionApi",
      typeVersion: 1,
      position: [460, -280],
      id: "evolution-envia",
      name: "Envia Mensagem",
      credentials: { evolutionApi: { id: "sFVkOjGmJUVVCrrz", name: "Evolution - Subscription Noi SF" } },
    },
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
  ],
  connections: {
    "Webhook - Enviar Mensagem": { main: [[{ node: "Valida Token", type: "main", index: 0 }]] },
    "Valida Token": {
      main: [
        [{ node: "Monta Dados", type: "main", index: 0 }],
        [{ node: "Nega Acesso", type: "main", index: 0 }],
      ],
    },
    "Monta Dados": { main: [[{ node: "Envia Mensagem", type: "main", index: 0 }]] },
    "Envia Mensagem": { main: [[{ node: "Responde OK", type: "main", index: 0 }]] },
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

const activateRes = await fetch(`${N8N_URL}/workflows/${json.id}/activate`, {
  method: "POST",
  headers: { "X-N8N-API-KEY": API_KEY },
});
const activateJson = await activateRes.json();
if (!activateRes.ok) {
  console.error("ERRO ao ativar:", activateRes.status, JSON.stringify(activateJson, null, 2));
  process.exit(1);
}
console.log("Workflow ativado:", activateJson.active);
