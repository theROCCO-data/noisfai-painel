"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/data/reservas-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaffUser } from "@/lib/auth";

export async function marcarConfirmacaoResolvida(id: number, telefone: string): Promise<ActionResult> {
  const staff = await getCurrentStaffUser();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("confirmacoes_gerente")
    .update({ status: "confirmado", confirmado_em: new Date().toISOString(), confirmado_por: staff?.name ?? null })
    .eq("id", id)
    .eq("status", "pendente");

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/conversas/${telefone}`);
  revalidatePath("/conversas");
  return { ok: true };
}
