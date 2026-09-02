import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type ItemCardapio = {
  id: number;
  codigo: number | null;
  categoria: string;
  nome: string;
  descricao: string | null;
  preco: number;
  disponivelPresencial: boolean;
  disponivelIfood: boolean;
};

export async function listCardapio(q?: string): Promise<{ existe: boolean; itens: ItemCardapio[] }> {
  const supabase = createAdminClient();

  let query = supabase
    .from("cardapio_itens")
    .select("id, codigo, categoria, nome, descricao, preco, disponivel_presencial, disponivel_ifood")
    .order("categoria", { ascending: true })
    .order("nome", { ascending: true });

  if (q) query = query.ilike("nome", `%${q}%`);

  const { data, error } = await query;

  if (error) {
    if (error.code === "PGRST205") return { existe: false, itens: [] };
    throw new Error(`listCardapio: ${error.message}`);
  }

  return {
    existe: true,
    itens: (data ?? []).map((i) => ({
      id: i.id,
      codigo: i.codigo,
      categoria: i.categoria,
      nome: i.nome,
      descricao: i.descricao,
      preco: Number(i.preco),
      disponivelPresencial: i.disponivel_presencial,
      disponivelIfood: i.disponivel_ifood,
    })),
  };
}

export async function listCategoriasCardapio(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("cardapio_itens").select("categoria");
  if (error) return [];
  const unicas = Array.from(new Set((data ?? []).map((d) => d.categoria))).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  return unicas;
}

export async function countItensRagCardapio(): Promise<number> {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("metadata->>source", "cardapio");
  return count ?? 0;
}
