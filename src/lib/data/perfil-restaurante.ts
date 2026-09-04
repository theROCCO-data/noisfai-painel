import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type FatoRestaurante = {
  id: number;
  categoria: string;
  topico: string;
  informacao: string;
  ordem: number;
};

export async function listPerfilRestaurante(): Promise<FatoRestaurante[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("perfil_restaurante")
    .select("id, categoria, topico, informacao, ordem")
    .order("categoria", { ascending: true })
    .order("ordem", { ascending: true });

  if (error) throw new Error(`listPerfilRestaurante: ${error.message}`);

  return (data ?? []).map((f) => ({
    id: f.id,
    categoria: f.categoria,
    topico: f.topico,
    informacao: f.informacao,
    ordem: f.ordem,
  }));
}
