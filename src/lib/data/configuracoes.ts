import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getConfiguracoes(): Promise<{ logoUrl: string | null }> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("configuracoes_painel").select("logo_url").eq("id", 1).maybeSingle();
  return { logoUrl: data?.logo_url ?? null };
}
