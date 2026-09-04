"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/data/reservas-actions";
import { reindexarItemCardapio, removerReindexCardapio } from "@/lib/rag/reindex";

export type SalvarItemInput = {
  id?: number;
  categoria: string;
  nome: string;
  descricao: string;
  preco: number;
  precoIfood: number | null;
  disponivelPresencial: boolean;
  disponivelIfood: boolean;
};

export async function salvarItemCardapio(input: SalvarItemInput): Promise<ActionResult> {
  const supabase = createAdminClient();

  let nomeAntigo: string | undefined;
  if (input.id) {
    const { data: atual } = await supabase.from("cardapio_itens").select("nome").eq("id", input.id).maybeSingle();
    nomeAntigo = atual?.nome;
  }

  const payload = {
    categoria: input.categoria,
    nome: input.nome,
    descricao: input.descricao || null,
    preco: input.preco,
    preco_ifood: input.disponivelIfood ? input.precoIfood : null,
    disponivel_presencial: input.disponivelPresencial,
    disponivel_ifood: input.disponivelIfood,
    updated_at: new Date().toISOString(),
  };

  const { data: salvo, error } = input.id
    ? await supabase.from("cardapio_itens").update(payload).eq("id", input.id).select("id").single()
    : await supabase.from("cardapio_itens").insert(payload).select("id").single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/cardapio");

  try {
    await reindexarItemCardapio({ id: salvo.id, ...input }, nomeAntigo);
  } catch (e) {
    return { ok: false, error: `Prato salvo, mas a reindexação do RAG falhou: ${(e as Error).message}. O bot ainda vai falar a versão antiga.` };
  }

  return { ok: true };
}

export async function excluirItemCardapio(id: number): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: atual } = await supabase.from("cardapio_itens").select("nome").eq("id", id).maybeSingle();

  const { error } = await supabase.from("cardapio_itens").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/cardapio");

  if (atual?.nome) {
    try {
      await removerReindexCardapio(id, atual.nome);
    } catch (e) {
      return { ok: false, error: `Prato excluído, mas não deu pra limpar o RAG: ${(e as Error).message}` };
    }
  }

  return { ok: true };
}
