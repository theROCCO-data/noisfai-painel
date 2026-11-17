"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaffUser } from "@/lib/auth";

export type MensagemEncontrada = {
  phone: string;
  texto: string;
  criadaEm: string;
  deNos: boolean;
};

/**
 * Busca no texto das conversas, como a pesquisa do WhatsApp: além de nome e
 * telefone (filtrados na própria lista), mostra as mensagens onde o termo
 * aparece. Lê o histórico gravado em `chat_messages` (cliente, bot e equipe).
 */
export async function buscarMensagens(termo: string): Promise<MensagemEncontrada[]> {
  if (!(await getCurrentStaffUser())) return [];

  // vírgula, parênteses e curingas quebram o filtro `or` do PostgREST
  const limpo = termo.replace(/[,()*%\\]/g, " ").replace(/\s+/g, " ").trim();
  if (limpo.length < 3) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("phone, from_me, user_message, bot_message, created_at")
    .not("message_id", "is", null)
    .or(`user_message.ilike.*${limpo}*,bot_message.ilike.*${limpo}*`)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) throw new Error(`buscarMensagens: ${error.message}`);

  return (data ?? [])
    .filter((m) => m.phone && String(m.phone).length <= 13) // fora grupos
    .map((m) => ({
      phone: String(m.phone),
      texto: String(m.user_message || m.bot_message || ""),
      criadaEm: m.created_at,
      deNos: !!m.from_me,
    }));
}
