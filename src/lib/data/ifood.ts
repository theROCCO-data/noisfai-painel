import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type ItemIfood = {
  id: number;
  categoria: string;
  nome: string;
  descricao: string | null;
  preco: number;
  disponivel: boolean;
};

export async function listIfood(q?: string): Promise<{ existe: boolean; itens: ItemIfood[] }> {
  const supabase = createAdminClient();

  let query = supabase
    .from("ifood_itens")
    .select("id, categoria, nome, descricao, preco, disponivel")
    .order("categoria", { ascending: true })
    .order("nome", { ascending: true });

  if (q) query = query.ilike("nome", `%${q}%`);

  const { data, error } = await query;

  if (error) {
    if (error.code === "PGRST205") return { existe: false, itens: [] };
    throw new Error(`listIfood: ${error.message}`);
  }

  return {
    existe: true,
    itens: (data ?? []).map((i) => ({ ...i, preco: Number(i.preco) })),
  };
}

export async function listCategoriasIfood(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("ifood_itens").select("categoria");
  if (error) return [];
  const unicas = Array.from(new Set((data ?? []).map((d) => d.categoria))).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  return unicas;
}

export async function countItensRagIfood(): Promise<number> {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("metadata->>source", "ifood");
  return count ?? 0;
}
