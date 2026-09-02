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
