import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type DiaCapacidade = {
  id: number;
  data: string;
  capacidadeBot: number;
  reservado: number;
  disponivelAtual: number;
};

export async function listCapacidadeDias(dataDe?: string, dataAte?: string): Promise<DiaCapacidade[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("capacidade_turno")
    .select("id, data, capacidade_bot, reservado, disponivel_atual")
    .eq("turno", "dia")
    .order("data", { ascending: true });

  if (dataDe) query = query.gte("data", dataDe);
  if (dataAte) query = query.lte("data", dataAte);

  const { data, error } = await query;

  if (error) throw new Error(`listCapacidadeDias: ${error.message}`);

  return (data ?? []).map((d) => ({
    id: d.id,
    data: d.data,
    capacidadeBot: d.capacidade_bot,
    reservado: d.reservado,
    disponivelAtual: d.disponivel_atual,
  }));
}
