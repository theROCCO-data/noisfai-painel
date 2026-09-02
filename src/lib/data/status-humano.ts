import "server-only";

export type StatusAtendimento = "ia" | "humano" | "atencao";

/**
 * Lê, em tempo real, o estado de atendimento de uma conversa — via o
 * workflow ponte "noisfAI - Consulta Status de Atendimento" no n8n, que lê
 * a mesma chave Redis que o bot já usa (`{telefone}@s.whatsapp.net_block`).
 * Nunca escreve nada. Se o n8n estiver fora do ar, falha "fechado" (assume
 * "ia") em vez de derrubar a tela — status de atendimento é informativo,
 * não deve quebrar o painel.
 */
export async function getStatusHumano(telefone: string): Promise<StatusAtendimento> {
  const url = process.env.N8N_STATUS_HUMANO_URL;
  const token = process.env.N8N_STATUS_HUMANO_TOKEN;
  if (!url || !token) return "ia";

  try {
    const res = await fetch(`${url}?telefone=${encodeURIComponent(telefone)}`, {
      headers: { "x-painel-token": token },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) return "ia";
    const json = await res.json();
    if (json.status === "humano" || json.status === "atencao") return json.status;
    return "ia";
  } catch {
    return "ia";
  }
}

export async function getStatusHumanoEmLote(telefones: string[]): Promise<Map<string, StatusAtendimento>> {
  const unicos = Array.from(new Set(telefones));
  const resultados = await Promise.all(unicos.map(async (t) => [t, await getStatusHumano(t)] as const));
  return new Map(resultados);
}
