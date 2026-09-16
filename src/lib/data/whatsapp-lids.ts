import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Registra (best-effort, nunca deve derrubar a tela se falhar) os LIDs
 * vistos associados a cada telefone. Achado em auditoria 16/09/2026: a
 * Evolution pode "esquecer" a entrada de um chat por LID na lista de
 * `findChats` depois de um tempo (parece consolidar por trás dos panos) —
 * as mensagens do cliente enviadas sob aquele LID continuam existindo e
 * são recuperáveis via `findMessages`, mas só se você já souber qual LID
 * consultar. Sem isso, mensagens inteiras de uma conversa simplesmente
 * desaparecem da tela sem aviso.
 */
export async function registrarLidsConhecidos(pares: { lid: string; telefone: string }[]): Promise<void> {
  if (pares.length === 0) return;
  const supabase = createAdminClient();
  await supabase
    .from("whatsapp_lids")
    .upsert(
      pares.map((p) => ({ lid: p.lid, telefone: p.telefone, atualizado_em: new Date().toISOString() })),
      { onConflict: "lid" }
    );
}

export async function getLidsConhecidos(telefone: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("whatsapp_lids").select("lid").eq("telefone", telefone);
  return (data ?? []).map((r) => r.lid);
}
