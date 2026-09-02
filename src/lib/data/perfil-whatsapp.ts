import "server-only";

export type PerfilWhatsapp = {
  nome: string | null;
  fotoUrl: string | null;
};

/**
 * Busca, ao vivo, nome e foto de perfil salvos no WhatsApp — via o workflow
 * ponte "noisfAI - Perfil WhatsApp" no n8n (Evolution API). Só é chamado sob
 * demanda (clique no popup de perfil), nunca como parte do polling da tela
 * de Conversas — senão viraria uma chamada à Evolution API a cada poucos
 * segundos por conversa aberta.
 */
export async function getPerfilWhatsapp(telefone: string): Promise<PerfilWhatsapp> {
  const url = process.env.N8N_PERFIL_WHATSAPP_URL;
  const token = process.env.N8N_STATUS_HUMANO_TOKEN;
  if (!url || !token) return { nome: null, fotoUrl: null };

  try {
    const res = await fetch(`${url}?telefone=${encodeURIComponent(telefone)}`, {
      headers: { "x-painel-token": token },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return { nome: null, fotoUrl: null };
    const json = await res.json();
    return { nome: json.nome ?? null, fotoUrl: json.fotoUrl ?? null };
  } catch {
    return { nome: null, fotoUrl: null };
  }
}
