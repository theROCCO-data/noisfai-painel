"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/data/reservas-actions";

export async function atualizarVagasDisponiveis(id: number, novoValor: number): Promise<ActionResult> {
  if (!Number.isFinite(novoValor) || novoValor < 0) {
    return { ok: false, error: "Valor inválido." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("capacidade_turno").update({ disponivel_atual: novoValor }).eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/capacidade");
  revalidatePath("/inicio");
  return { ok: true };
}

/**
 * Muda o total fixo de vagas do dia (capacidade_bot). Ajusta disponivel_atual
 * pela mesma diferença, pra não criar/apagar vagas "do nada" — se o total
 * sobe 5, disponível sobe 5 também; se desce 5, desponível desce 5 (sem
 * deixar negativo).
 */
export async function atualizarCapacidadeTotal(id: number, novoValor: number): Promise<ActionResult> {
  if (!Number.isFinite(novoValor) || novoValor < 0) {
    return { ok: false, error: "Valor inválido." };
  }

  const supabase = createAdminClient();
  const { data: atual, error: fetchErr } = await supabase
    .from("capacidade_turno")
    .select("capacidade_bot, disponivel_atual")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!atual) return { ok: false, error: "Dia não encontrado." };

  const diff = novoValor - atual.capacidade_bot;
  const novoDisponivel = Math.max(0, atual.disponivel_atual + diff);

  const { error } = await supabase
    .from("capacidade_turno")
    .update({ capacidade_bot: novoValor, disponivel_atual: novoDisponivel })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/capacidade");
  revalidatePath("/inicio");
  return { ok: true };
}

/**
 * Mesma lógica de atualizarCapacidadeTotal, mas aplicada a vários dias de
 * uma vez — usado quando o gerente quer uma mudança geral (ex: capacidade
 * de todo o período visível na tela) em vez de ajustar dia por dia. Cada
 * linha ajusta o disponível pela própria diferença (não zera o consumido).
 */
export async function atualizarCapacidadeTotalEmLote(ids: number[], novoValor: number): Promise<ActionResult> {
  if (!Number.isFinite(novoValor) || novoValor < 0) {
    return { ok: false, error: "Valor inválido." };
  }
  if (ids.length === 0) return { ok: true };

  const supabase = createAdminClient();
  const { data: linhas, error: fetchErr } = await supabase
    .from("capacidade_turno")
    .select("id, capacidade_bot, disponivel_atual")
    .in("id", ids);
  if (fetchErr) return { ok: false, error: fetchErr.message };

  const resultados = await Promise.all(
    (linhas ?? []).map((l) => {
      const diff = novoValor - l.capacidade_bot;
      const novoDisponivel = Math.max(0, l.disponivel_atual + diff);
      return supabase
        .from("capacidade_turno")
        .update({ capacidade_bot: novoValor, disponivel_atual: novoDisponivel })
        .eq("id", l.id);
    })
  );
  const comErro = resultados.find((r) => r.error);
  if (comErro?.error) return { ok: false, error: comErro.error.message };

  revalidatePath("/capacidade");
  revalidatePath("/inicio");
  return { ok: true };
}
