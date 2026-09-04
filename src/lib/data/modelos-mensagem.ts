import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaffUser } from "@/lib/auth";

export type ModeloMensagem = {
  id: number;
  nome: string;
  tipo: "texto" | "imagem" | "audio";
  conteudo: string | null;
  favorito: boolean;
};

/**
 * Só "texto" tem conteúdo utilizável hoje (imagem/áudio ficam no schema
 * prontos pra quando o envio de mídia pelo Painel for implementado) — o
 * filtro aqui evita listar modelos que a UI ainda não sabe usar.
 *
 * `favorito` é por usuário logado (tabela `modelos_mensagem_favoritos`) —
 * cada atendente marca os próprios modelos mais usados sem afetar os outros.
 * Favoritos aparecem primeiro na lista, o resto em ordem alfabética.
 */
export async function listModelosMensagem(): Promise<ModeloMensagem[]> {
  const supabase = createAdminClient();

  const [{ data, error }, staff] = await Promise.all([
    supabase
      .from("modelos_mensagem")
      .select("id, nome, tipo, conteudo")
      .eq("tipo", "texto")
      .order("nome", { ascending: true }),
    getCurrentStaffUser(),
  ]);
  if (error) return [];

  let favoritosIds = new Set<number>();
  if (staff) {
    const { data: favoritos } = await supabase
      .from("modelos_mensagem_favoritos")
      .select("modelo_id")
      .eq("user_id", staff.id);
    favoritosIds = new Set((favoritos ?? []).map((f) => f.modelo_id));
  }

  const modelos: ModeloMensagem[] = (data ?? []).map((m) => ({ ...m, favorito: favoritosIds.has(m.id) }));
  modelos.sort((a, b) => {
    if (a.favorito !== b.favorito) return a.favorito ? -1 : 1;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
  return modelos;
}
