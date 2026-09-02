import "server-only";

/**
 * Lê, em tempo real, se uma conversa está com humano — via o workflow ponte
 * "noisfAI - Consulta Status de Atendimento" no n8n, que lê a mesma chave
 * Redis que o bot já usa (`{telefone}@s.whatsapp.net_block`). Nunca escreve
 * nada. Se o n8n estiver fora do ar, falha "fechado" (assume `false`/bot)
 * em vez de derrubar a tela — status de atendimento é informativo, não deve
 * quebrar o painel.
 */
export async function getStatusHumano(telefone: string): Promise<boolean> {
  const url = process.env.N8N_STATUS_HUMANO_URL;
  const token = process.env.N8N_STATUS_HUMANO_TOKEN;
  if (!url || !token) return false;

  try {
    const res = await fetch(`${url}?telefone=${encodeURIComponent(telefone)}`, {
      headers: { "x-painel-token": token },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const json = await res.json();
    return json.humano === true;
  } catch {
    return false;
  }
}

export async function getStatusHumanoEmLote(telefones: string[]): Promise<Map<string, boolean>> {
  const unicos = Array.from(new Set(telefones));
  const resultados = await Promise.all(unicos.map(async (t) => [t, await getStatusHumano(t)] as const));
  return new Map(resultados);
}
