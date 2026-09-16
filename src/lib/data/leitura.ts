import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * "Não lida" é rastreada aqui no Painel, não na Evolution — a Evolution
 * nunca marca `unreadCount` de verdade nesse número (confirmado ao vivo:
 * 0 de ~1000 chats com unreadCount > 0), já que ninguém abre o WhatsApp
 * real pra marcar como lido. `lida_em` é a última vez que ALGUÉM do time
 * abriu essa conversa no Painel.
 *
 * Só vale a partir do lançamento dessa funcionalidade (16/09/2026) — uma
 * mensagem antiga não deve aparecer como "não lida" retroativamente, então
 * qualquer última-mensagem anterior a esse instante nunca conta.
 */
export const LANCAMENTO_NAO_LIDAS = new Date("2026-09-16T00:00:00Z");

export async function getUltimasLeituras(telefones: string[]): Promise<Map<string, Date>> {
  if (telefones.length === 0) return new Map();
  const supabase = createAdminClient();
  const { data } = await supabase.from("conversas_leitura").select("telefone, lida_em").in("telefone", telefones);
  const mapa = new Map<string, Date>();
  for (const row of data ?? []) mapa.set(row.telefone, new Date(row.lida_em));
  return mapa;
}

export async function marcarComoLida(telefone: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("conversas_leitura").upsert({ telefone, lida_em: new Date().toISOString() }, { onConflict: "telefone" });
}
