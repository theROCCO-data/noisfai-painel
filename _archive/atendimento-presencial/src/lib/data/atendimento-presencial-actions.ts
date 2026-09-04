"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/data/reservas-actions";

export type CriarAtendimentoInput = {
  clienteId: number | null;
  nome: string;
  telefone: string;
  email: string;
  observacao: string;
  itens: { cardapioItemId: number; nome: string; preco: number; quantidade: number }[];
};

/**
 * Registra um cliente que comeu no restaurante sem reserva prévia — data e
 * hora vêm do próprio `now()` do insert (não é campo do formulário). Se
 * `clienteId` não vier (cliente novo, não encontrado na busca por nome),
 * cadastra por telefone (upsert, mesmo padrão de `criarReservaManual`) ou,
 * na ausência de telefone, insere um cliente novo direto por nome.
 */
export async function criarAtendimentoPresencial(input: CriarAtendimentoInput): Promise<ActionResult> {
  if (!input.nome.trim() && !input.clienteId) return { ok: false, error: "Informe o cliente." };
  if (input.itens.length === 0) return { ok: false, error: "Adicione pelo menos um item ao pedido." };

  const supabase = createAdminClient();

  let clienteId = input.clienteId;
  if (!clienteId) {
    if (input.telefone.trim()) {
      const { data: cliente, error: clienteErr } = await supabase
        .from("clientes")
        .upsert(
          { telefone: input.telefone.trim(), nome: input.nome.trim(), email: input.email.trim() || null },
          { onConflict: "telefone" }
        )
        .select("id")
        .single();
      if (clienteErr) return { ok: false, error: `Erro ao gravar cliente: ${clienteErr.message}` };
      clienteId = cliente.id;
    } else {
      const { data: cliente, error: clienteErr } = await supabase
        .from("clientes")
        .insert({ nome: input.nome.trim(), email: input.email.trim() || null })
        .select("id")
        .single();
      if (clienteErr) return { ok: false, error: `Erro ao gravar cliente: ${clienteErr.message}` };
      clienteId = cliente.id;
    }
  }

  const total = input.itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);

  const { data: pedido, error: pedidoErr } = await supabase
    .from("pedidos_presenciais")
    .insert({ cliente_id: clienteId, observacao: input.observacao || null, total })
    .select("id")
    .single();
  if (pedidoErr) return { ok: false, error: `Erro ao gravar atendimento: ${pedidoErr.message}` };

  const { error: itensErr } = await supabase.from("pedidos_presenciais_itens").insert(
    input.itens.map((i) => ({
      pedido_id: pedido.id,
      cardapio_item_id: i.cardapioItemId,
      nome_item: i.nome,
      preco_unitario: i.preco,
      quantidade: i.quantidade,
    }))
  );
  if (itensErr) return { ok: false, error: `Atendimento gravado, mas falhou ao gravar os itens: ${itensErr.message}` };

  revalidatePath("/atendimento-presencial");
  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true };
}
