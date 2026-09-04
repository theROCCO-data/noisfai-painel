import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type ItemAtendimentoPresencial = {
  id: number;
  nomeItem: string;
  precoUnitario: number;
  quantidade: number;
};

export type AtendimentoPresencial = {
  id: number;
  criadoEm: string;
  clienteId: number;
  clienteNome: string;
  observacao: string | null;
  total: number;
  itens: ItemAtendimentoPresencial[];
};

export async function listAtendimentosPresenciais(de?: string, ate?: string): Promise<AtendimentoPresencial[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("pedidos_presenciais")
    .select("id, criado_em, observacao, total, clientes(id, nome), pedidos_presenciais_itens(id, nome_item, preco_unitario, quantidade)")
    .order("criado_em", { ascending: false });

  if (de) query = query.gte("criado_em", `${de}T00:00:00-03:00`);
  if (ate) query = query.lte("criado_em", `${ate}T23:59:59-03:00`);

  const { data, error } = await query;
  if (error) throw new Error(`listAtendimentosPresenciais: ${error.message}`);

  return (data ?? []).map((p) => {
    const cliente = Array.isArray(p.clientes) ? p.clientes[0] : p.clientes;
    return {
      id: p.id,
      criadoEm: p.criado_em,
      clienteId: cliente?.id ?? 0,
      clienteNome: cliente?.nome ?? "—",
      observacao: p.observacao,
      total: Number(p.total),
      itens: (p.pedidos_presenciais_itens ?? []).map((i) => ({
        id: i.id,
        nomeItem: i.nome_item,
        precoUnitario: Number(i.preco_unitario),
        quantidade: i.quantidade,
      })),
    };
  });
}

/** Usado no bloco "Atendimentos presenciais" dentro do detalhe do cliente. */
export async function listAtendimentosPresenciaisPorCliente(clienteId: number): Promise<AtendimentoPresencial[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("pedidos_presenciais")
    .select("id, criado_em, observacao, total, clientes(id, nome), pedidos_presenciais_itens(id, nome_item, preco_unitario, quantidade)")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false });

  if (error) throw new Error(`listAtendimentosPresenciaisPorCliente: ${error.message}`);

  return (data ?? []).map((p) => {
    const cliente = Array.isArray(p.clientes) ? p.clientes[0] : p.clientes;
    return {
      id: p.id,
      criadoEm: p.criado_em,
      clienteId: cliente?.id ?? 0,
      clienteNome: cliente?.nome ?? "—",
      observacao: p.observacao,
      total: Number(p.total),
      itens: (p.pedidos_presenciais_itens ?? []).map((i) => ({
        id: i.id,
        nomeItem: i.nome_item,
        precoUnitario: Number(i.preco_unitario),
        quantidade: i.quantidade,
      })),
    };
  });
}
