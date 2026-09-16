"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/data/reservas-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaffUser } from "@/lib/auth";

/**
 * `confirmadoPor` é opcional: quando quem resolve a pendência escolheu
 * explicitamente OUTRA pessoa como responsável (ex.: popup de grupo grande,
 * onde o gerente pode estar registrando uma confirmação que a Claudinha fez
 * por telefone), usa esse nome em vez do usuário logado no navegador --
 * senão `confirmado_por` mentia sobre quem de fato confirmou com o cliente.
 */
export async function marcarConfirmacaoResolvida(id: number, telefone: string, confirmadoPor?: string): Promise<ActionResult> {
  const staff = await getCurrentStaffUser();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("confirmacoes_gerente")
    .update({ status: "confirmado", confirmado_em: new Date().toISOString(), confirmado_por: confirmadoPor ?? staff?.name ?? null })
    .eq("id", id)
    .eq("status", "pendente");

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/conversas/${telefone}`);
  revalidatePath("/conversas");
  return { ok: true };
}
