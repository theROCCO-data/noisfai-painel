"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/data/reservas-actions";
import { reindexarItemIfood, removerReindexIfood } from "@/lib/rag/reindex";

export type SalvarItemIfoodInput = {
  id?: number;
  categoria: string;
  nome: string;
  descricao: string;
  preco: number;
  disponivel: boolean;
};

export async function salvarItemIfood(input: SalvarItemIfoodInput): Promise<ActionResult> {
  const supabase = createAdminClient();

  let nomeAntigo: string | undefined;
  if (input.id) {
    const { data: atual } = await supabase.from("ifood_itens").select("nome").eq("id", input.id).maybeSingle();
    nomeAntigo = atual?.nome;
  }

  const payload = {
    categoria: input.categoria,
    nome: input.nome,
    descricao: input.descricao || null,
    preco: input.preco,
    disponivel: input.disponivel,
    updated_at: new Date().toISOString(),
  };

  const { data: salvo, error } = input.id
    ? await supabase.from("ifood_itens").update(payload).eq("id", input.id).select("id").single()
    : await supabase.from("ifood_itens").insert(payload).select("id").single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/ifood");

  try {
    await reindexarItemIfood({ id: salvo.id, ...input }, nomeAntigo);
  } catch (e) {
    return { ok: false, error: `Item salvo, mas a reindexação do RAG falhou: ${(e as Error).message}. O bot ainda vai falar a versão antiga.` };
  }

  return { ok: true };
}

export async function excluirItemIfood(id: number): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: atual } = await supabase.from("ifood_itens").select("nome").eq("id", id).maybeSingle();

  const { error } = await supabase.from("ifood_itens").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/ifood");

  if (atual?.nome) {
    try {
      await removerReindexIfood(id, atual.nome);
    } catch (e) {
      return { ok: false, error: `Item excluído, mas não deu pra limpar o RAG: ${(e as Error).message}` };
    }
  }

  return { ok: true };
}
